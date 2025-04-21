import { pgTable, text, serial, integer, boolean, varchar, timestamp, decimal, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['bank_transfer', 'credit_card', 'cash_on_delivery', 'prompt_pay']);
export const topupStatusEnum = pgEnum('topup_status', ['pending', 'completed', 'failed']);

// ตาราง users - ข้อมูลผู้ใช้
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullname: text("fullname"),
  role: userRoleEnum("role").default("user"),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  province: text("province"),
  district: text("district"),
  subdistrict: text("subdistrict"),
  zipcode: text("zipcode"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  products: many(products),
  orders: many(orders),
  categories: many(categories),
}));

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
  zipcode: text("zipcode"),
  addressNumber: text("address_number"),
  moo: text("moo"),
  soi: text("soi"),
  road: text("road"),
  building: text("building"),
  floor: text("floor"),
  storeName: text("store_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  orders: many(orders)
}));

// ตาราง categories - ข้อมูลหมวดหมู่สินค้า
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  icon: text("icon"),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  products: many(products),
  parent: one(categories, { 
    fields: [categories.parentId], 
    references: [categories.id] 
  }),
  children: many(categories, { relationName: "children" })
}));

// ตาราง products - ข้อมูลสินค้า
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  imageUrl: text("image_url"),
  status: text("status").default("active"),
  categoryId: integer("category_id").references(() => categories.id),
  tags: text("tags").array(),
  dimensions: json("dimensions"), // { width, height, length }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, { fields: [products.userId], references: [users.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  orderItems: many(orderItems)
}));

// ตาราง shipping_methods - ข้อมูลวิธีการจัดส่ง
export const shippingMethods = pgTable("shipping_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  deliveryTime: text("delivery_time"),
  logo: text("logo"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const shippingMethodsRelations = relations(shippingMethods, ({ one, many }) => ({
  user: one(users, { fields: [shippingMethods.userId], references: [users.id] }),
  orders: many(orders)
}));

// ตาราง discounts - ข้อมูลส่วนลด
export const discounts = pgTable("discounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // percentage, fixed
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const discountsRelations = relations(discounts, ({ one, many }) => ({
  user: one(users, { fields: [discounts.userId], references: [users.id] }),
  orders: many(orders)
}));

// ตาราง order_items - รายการสินค้าในคำสั่งซื้อ
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

// ตาราง orders - ข้อมูลคำสั่งซื้อ
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  shippingMethodId: integer("shipping_method_id").references(() => shippingMethods.id),
  discountId: integer("discount_id").references(() => discounts.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingFee: decimal("shipping_fee", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("bank_transfer"),
  paymentStatus: text("payment_status").default("pending"),
  trackingNumber: text("tracking_number"),
  shippingDate: timestamp("shipping_date"),
  note: text("note"),
  status: orderStatusEnum("status").default("pending"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  dimensions: json("dimensions"), // { width, height, length }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

// ความสัมพันธ์ของตาราง orders กับตารางอื่นๆ
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  shippingMethod: one(shippingMethods, { fields: [orders.shippingMethodId], references: [shippingMethods.id] }),
  discount: one(discounts, { fields: [orders.discountId], references: [discounts.id] }),
  items: many(orderItems)
}));

// ตาราง topups - ข้อมูลการเติมเงิน
export const topups = pgTable("topups", {
  id: serial("id").primaryKey(),
  referenceId: text("reference_id").notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull(), // prompt_pay, credit_card, bank_transfer
  status: topupStatusEnum("status").default("pending"),
  qrCodeUrl: text("qr_code_url"),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id),
});

export const topupsRelations = relations(topups, ({ one }) => ({
  user: one(users, { fields: [topups.userId], references: [users.id] }),
}));

// ตาราง feeHistory - ประวัติการหักค่าธรรมเนียม
export const feeHistory = pgTable("fee_history", {
  id: serial("id").primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  feeType: text("fee_type").notNull().default("order"), // order, shipping, other
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
});

export const feeHistoryRelations = relations(feeHistory, ({ one }) => ({
  user: one(users, { fields: [feeHistory.userId], references: [users.id] }),
  order: one(orders, { fields: [feeHistory.orderId], references: [orders.id] }),
}));

// อัพเดต usersRelations เพื่อเพิ่มความสัมพันธ์กับ topups
export const updateUsersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  products: many(products),
  orders: many(orders),
  categories: many(categories),
  topups: many(topups),
}));

// สร้าง schemas สำหรับการ insert ข้อมูล
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullname: true,
  email: true,
  phone: true,
  role: true,
  balance: true,
  address: true,
  province: true,
  district: true,
  subdistrict: true,
  zipcode: true,
});

export const insertCustomerSchema = createInsertSchema(customers);
export const insertCategorySchema = createInsertSchema(categories);
export const insertProductSchema = createInsertSchema(products);
export const insertShippingMethodSchema = createInsertSchema(shippingMethods);
export const insertDiscountSchema = createInsertSchema(discounts);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertOrderSchema = createInsertSchema(orders);
export const insertTopupSchema = createInsertSchema(topups);
export const insertFeeHistorySchema = createInsertSchema(feeHistory);

// สร้าง types จาก schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertShippingMethod = z.infer<typeof insertShippingMethodSchema>;
export type ShippingMethod = typeof shippingMethods.$inferSelect;

export type InsertDiscount = z.infer<typeof insertDiscountSchema>;
export type Discount = typeof discounts.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertTopup = z.infer<typeof insertTopupSchema>;
export type Topup = typeof topups.$inferSelect;

export type InsertFeeHistory = z.infer<typeof insertFeeHistorySchema>;
export type FeeHistory = typeof feeHistory.$inferSelect;
