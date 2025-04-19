import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { pool } from "./db";
import connectPg from "connect-pg-simple";
import jwt from "jsonwebtoken";

const PostgresSessionStore = connectPg(session);

// Environment variables with fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'purpledash-secure-jwt-secret-key-2025';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";
  console.log('Setting up auth, environment:', isProduction ? 'production' : 'development');
  
  // ตั้งค่า express-session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "purpledash-secure-secret-key-2025",
    name: "purpledash.sid", // ตั้งชื่อ cookie ให้เป็นเอกลักษณ์
    resave: true, // ปรับเป็น true เพื่อแก้ปัญหา session ไม่ถูกบันทึก
    saveUninitialized: true, // ปรับเป็น true เพื่อแก้ปัญหา session ไม่ถูกบันทึก
    store: new PostgresSessionStore({ 
      pool,
      tableName: 'session', // ชื่อตารางที่จะใช้เก็บข้อมูล session
      createTableIfMissing: true 
    }),
    cookie: {
      secure: false, // ปรับเป็น false เพื่อให้ทำงานบน HTTP
      httpOnly: true, // ป้องกันการเข้าถึง cookie ด้วย JavaScript
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      sameSite: 'none', // ปรับเป็น 'none' เพื่อให้ทำงานบนทุกอุปกรณ์ (โดยเฉพาะ iPad)
      path: '/'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, fullname, email, phone } = req.body;
      
      // ตรวจสอบว่ามีผู้ใช้ชื่อนี้แล้วหรือไม่
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "มีผู้ใช้ชื่อนี้ในระบบแล้ว กรุณาเลือกชื่อผู้ใช้อื่น" 
        });
      }

      // สร้างผู้ใช้ใหม่
      const hashedPassword = await hashPassword(password);
      
      // สร้างข้อมูลผู้ใช้ใหม่ตามโครงสร้าง
      const insertUser = {
        username,
        password: hashedPassword,
        fullname,
        email,
        phone,
      };
      
      // เพิ่มข้อมูลลงฐานข้อมูล
      const user = await storage.createUser(insertUser);

      // เข้าสู่ระบบโดยอัตโนมัติหลังจากลงทะเบียน
      req.login(user, (err) => {
        if (err) return next(err);
        
        // ส่งข้อมูลผู้ใช้กลับไป (ยกเว้นรหัสผ่าน)
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({
          success: true,
          message: "ลงทะเบียนสำเร็จและเข้าสู่ระบบแล้ว",
          user: userWithoutPassword
        });
      });
    } catch (error: any) {
      console.error("Error registering user:", error);
      res.status(500).json({ 
        success: false, 
        message: "เกิดข้อผิดพลาดในการลงทะเบียน: " + error.message 
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('Login request received:', req.body.username);
    
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      
      if (!user) {
        console.error('Login failed: Invalid credentials');
        return res.status(401).json({ 
          success: false, 
          message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" 
        });
      }
      
      req.login(user, (loginErr: any) => {
        if (loginErr) {
          console.error('Login session creation error:', loginErr);
          return next(loginErr);
        }
        
        console.log('Login successful. Session ID:', req.sessionID);
        console.log('User authenticated:', req.isAuthenticated());
        
        // ส่งข้อมูลผู้ใช้กลับไป (ยกเว้นรหัสผ่าน)
        const { password, ...userWithoutPassword } = user;
        
        // สร้าง JWT token
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' } // หมดอายุใน 7 วัน
        );
        
        // จัดรูปแบบข้อมูลให้ตรงกันทั้ง API
        res.json({
          success: true,
          message: "เข้าสู่ระบบสำเร็จ",
          user: userWithoutPassword,
          token
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ success: true, message: "ออกจากระบบสำเร็จ" });
    });
  });

  // ใช้ middleware ตรวจสอบ JWT token
  app.get("/api/user", async (req: any, res: any) => {
    // ถ้ามีการเข้าสู่ระบบด้วย session
    if (req.isAuthenticated() && req.user) {
      const { password, ...userWithoutPassword } = req.user as SelectUser;
      return res.json({
        success: true,
        user: userWithoutPassword
      });
    }
    
    // ตรวจสอบ Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบ" });
    }

    const token = authHeader.split(' ')[1]; // แยก "Bearer" ออกจาก token
    if (!token) {
      return res.status(401).json({ success: false, message: "รูปแบบ token ไม่ถูกต้อง" });
    }

    try {
      // ตรวจสอบความถูกต้องของ token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // ดึงข้อมูลผู้ใช้จาก ID ที่อยู่ใน token
      storage.getUser(decoded.id).then(user => {
        if (!user) {
          return res.status(401).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้" });
        }
        
        // ส่งข้อมูลผู้ใช้กลับไป (ยกเว้นรหัสผ่าน)
        const { password, ...userWithoutPassword } = user;
        res.json({
          success: true,
          user: userWithoutPassword
        });
      }).catch(err => {
        return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้" });
      });
    } catch (error: any) {
      return res.status(401).json({ success: false, message: "Token ไม่ถูกต้องหรือหมดอายุ" });
    }
  });
}