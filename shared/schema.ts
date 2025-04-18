import { pgTable, text, serial, integer, boolean, varchar, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ตาราง users - ข้อมูลผู้ใช้
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullname: text("fullname"),
  role: text("role").default("user"),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ตาราง customers - ข้อมูลลูกค้า
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  subdistrict: text("subdistrict"),
  district: text("district"),
  province: text("province"),
  postalCode: text("postal_code"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

// ตาราง products - ข้อมูลสินค้า
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  stock: integer("stock").default(0),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

// ตาราง orders - ข้อมูลคำสั่งซื้อ
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  address: text("address"),
  subdistrict: text("subdistrict"),
  district: text("district"),
  province: text("province").notNull(),
  postalCode: text("postal_code"),
  note: text("note"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  courier: text("courier").notNull(),
  trackingNumber: text("tracking_number"),
  shippingDate: timestamp("shipping_date"),
  codAmount: decimal("cod_amount", { precision: 10, scale: 2 }).default("0"),
  packageType: integer("package_type"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  size: text("size"),
  status: text("status").default("pending"),
  items: json("items"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

// สร้าง schemas สำหรับการ insert ข้อมูล
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullname: true,
});

export const insertCustomerSchema = createInsertSchema(customers);
export const insertProductSchema = createInsertSchema(products);
export const insertOrderSchema = createInsertSchema(orders);

// สร้าง types จาก schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
