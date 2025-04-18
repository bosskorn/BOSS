import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { pool } from "./db";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

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
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "purpledash-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({ 
      pool,
      tableName: 'session', // ชื่อตารางที่จะใช้เก็บข้อมูล session
      createTableIfMissing: true 
    }),
    cookie: {
      secure: false, // ปิดใช้งาน secure เพื่อให้ทำงานได้บน HTTP
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
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
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) return next(err);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" 
        });
      }
      
      req.login(user, (loginErr: any) => {
        if (loginErr) return next(loginErr);
        
        // ส่งข้อมูลผู้ใช้กลับไป (ยกเว้นรหัสผ่าน)
        const { password, ...userWithoutPassword } = user;
        
        // จัดรูปแบบข้อมูลให้ตรงกันทั้ง API
        res.json({
          success: true,
          message: "เข้าสู่ระบบสำเร็จ",
          user: userWithoutPassword
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

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        success: false, 
        message: "ไม่ได้เข้าสู่ระบบ" 
      });
    }
    
    // ส่งข้อมูลผู้ใช้ที่เข้าสู่ระบบอยู่ (ยกเว้นรหัสผ่าน)
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json({
      success: true,
      user: userWithoutPassword
    });
  });
}