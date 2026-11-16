# Carrier Partner API (ร่าง v1)

API สำหรับบริษัทขนส่งที่ต้องการเชื่อมกับรวมร้าน เมื่อเชื่อมแล้ว ร้านทุกร้านในรวมร้านเลือกใช้ขนส่งนั้นได้ทั้งสองแบบ:
- **บัญชีของร้าน:** ร้านกรอกรหัสลูกค้าที่ได้จากขนส่ง
- **ผ่านรวมร้าน:** ใช้บัญชีพาร์ทเนอร์ของรวมร้าน

**ทิศทางการเรียก:**
- รวมร้าน **เรียกไปที่** ระบบของขนส่ง ผ่าน endpoint ที่ขนส่งเปิดตามสเปกนี้
- ขนส่ง **แจ้งกลับ** รวมร้านผ่าน webhook

---

## การยืนยันตัวตน

| ทิศทาง | วิธี |
|---|---|
| รวมร้าน → ขนส่ง | `Authorization: Bearer <token>` ที่ขนส่งออกให้ ต่อบัญชี (บัญชีร้าน หรือบัญชีพาร์ทเนอร์ของรวมร้าน) |
| ขนส่ง → รวมร้าน (webhook) | ลงลายมือชื่อ `X-Ruamraan-Signature: sha256=<HMAC ของ body ด้วย secret ที่แลกกันตอนลงทะเบียน>` |

**มาตรฐานทั่วไป:**
- ทุกคำขอเป็น HTTPS + JSON (UTF-8)
- เวลาเป็น ISO 8601 พร้อมเขตเวลา
- เงินเป็นสตางค์ (integer) สกุล THB
- น้ำหนักเป็นกรัม ขนาดเป็นเซนติเมตร
- คำขอที่สร้างข้อมูลใส่ `Idempotency-Key` เสมอ ขนส่งต้องคืนผลเดิมเมื่อได้ key ซ้ำ

---

## Endpoint ที่ขนส่งต้องเปิด

### 1. ขอราคา `POST /v1/quotes`

```json
{
  "from": { "postcode": "10400", "province": "กรุงเทพมหานคร", "district": "พญาไท" },
  "to":   { "postcode": "10110", "province": "กรุงเทพมหานคร", "district": "คลองเตย" },
  "parcels": [{ "weight_g": 500, "length_cm": 30, "width_cm": 20, "height_cm": 10 }],
  "cod_amount": 0,
  "pickup": true
}
```

คืนค่า:

```json
{
  "quotes": [
    { "service_code": "EXPRESS", "service_name": "ส่งด่วน",
      "price": 3200, "cod_fee": 0, "currency": "THB",
      "eta_days_min": 1, "eta_days_max": 2,
      "pickup_cutoff": "15:00", "expires_at": "2026-11-16T23:59:00+07:00" }
  ]
}
```

### 2. สร้างพัสดุ `POST /v1/shipments`

```json
{
  "reference": "RR-1042",
  "service_code": "EXPRESS",
  "sender":   { "name": "บ้านผ้าฝ้าย", "phone": "0650000000", "address": "18/4 ซ.อารีย์ 2", "province": "กรุงเทพมหานคร", "district": "พญาไท", "subdistrict": "สามเสนใน", "postcode": "10400" },
  "receiver": { "name": "มะลิ ใจดี", "phone": "0812345678", "address": "99/1 ซ.สุขุมวิท 22", "province": "กรุงเทพมหานคร", "district": "คลองเตย", "subdistrict": "คลองตัน", "postcode": "10110" },
  "parcels": [{ "weight_g": 500, "length_cm": 30, "width_cm": 20, "height_cm": 10, "description": "เสื้อผ้า" }],
  "cod_amount": 0,
  "insurance_value": 0,
  "pickup": { "requested": true, "date": "2026-11-17" }
}
```

คืนค่า `201`:

```json
{ "shipment_id": "shp_8f2c", "tracking_no": "TH0142XK77A", "price": 3200, "label_ready": true, "status": "CREATED" }
```

### 3. ใบปะหน้า `GET /v1/shipments/{shipment_id}/label?format=pdf|zpl&size=100x150`

คืนไฟล์ตรง (`application/pdf` หรือ `text/plain` สำหรับ ZPL)

### 4. นัดเข้ารับ `POST /v1/pickups`

```json
{ "shipment_ids": ["shp_8f2c","shp_8f2d"], "date": "2026-11-17", "time_window": "13:00-17:00" }
```

### 5. ยกเลิก `POST /v1/shipments/{shipment_id}/cancel`

ยกเลิกได้ก่อนขนส่งรับของ หลังรับของแล้วคืน `409` พร้อมเหตุผล

### 6. ติดตาม `GET /v1/shipments/{shipment_id}/tracking`

ใช้สำรองเมื่อ webhook ไม่มา รูปแบบเหตุการณ์เหมือน webhook ด้านล่าง

---

## Webhook ที่ขนส่งส่งกลับมา

`POST https://api.ruamraan.example/carrier/v1/events` (ที่อยู่จริงให้ตอนลงทะเบียน)

```json
{
  "event_id": "evt_01J...",
  "shipment_id": "shp_8f2c",
  "tracking_no": "TH0142XK77A",
  "status": "PICKED_UP",
  "occurred_at": "2026-11-17T14:05:00+07:00",
  "location": "ศูนย์คัดแยกบางนา",
  "note": "",
  "cod": { "collected": 0, "remitted": 0, "remit_ref": null }
}
```

**สถานะมาตรฐาน:**

| status | ความหมาย | สถานะออเดอร์ในรวมร้าน |
|---|---|---|
| `CREATED` | สร้างพัสดุแล้ว | รอพิมพ์ใบปะหน้า |
| `PICKUP_SCHEDULED` | นัดเข้ารับแล้ว | รอขนส่งเข้ารับ |
| `PICKUP_FAILED` | เข้ารับไม่สำเร็จ | รอขนส่งเข้ารับ + ป้ายมีปัญหา |
| `PICKED_UP` | รับของแล้ว | ส่งแล้ว |
| `IN_TRANSIT` | ระหว่างทาง | ส่งแล้ว |
| `OUT_FOR_DELIVERY` | กำลังนำส่ง | ส่งแล้ว |
| `DELIVERED` | ส่งถึงแล้ว | ส่งแล้ว (ส่งถึง) |
| `DELIVERY_FAILED` | ส่งไม่สำเร็จ | ป้ายมีปัญหา |
| `RETURNING` / `RETURNED` | ตีกลับ | ป้ายมีปัญหา + เริ่มขั้นตอนคืนสินค้า |
| `CANCELLED` | ยกเลิก | กลับไปรอจัดส่ง |
| `COD_REMITTED` | โอนเงิน COD แล้ว | บันทึกในบัญชีเงิน COD |

**การรับ webhook:**
- รวมร้านตอบ `200` ภายใน 5 วินาที
- ถ้าไม่ได้ `2xx` ขนส่งส่งซ้ำแบบ backoff อย่างน้อย 24 ชั่วโมง
- รวมร้านกันซ้ำด้วย `event_id`

---

## ขั้นตอนเข้าร่วมเป็นพาร์ทเนอร์

1. ลงทะเบียนพาร์ทเนอร์ ได้ `partner_id` และ webhook secret
2. เปิด endpoint ตามสเปกบน sandbox
3. รวมร้านรันชุดทดสอบอัตโนมัติ: ขอราคา สร้าง ใบปะหน้า นัดเข้ารับ ยกเลิก และ webhook ทุกสถานะ
4. ตกลงเรื่องโหมด "ผ่านรวมร้าน" (ถ้าต้องการ): ราคาพาร์ทเนอร์ รอบวางบิล และรอบโอน COD
5. เปิดใช้จริง ขนส่งจะแสดงในหน้า ตั้งค่า › การจัดส่ง ของทุกร้าน

## สิ่งที่ยังต้องตัดสินใจ

- **เกณฑ์ขั้นต่ำ:** จะรับเฉพาะขนส่งที่ผ่านเกณฑ์ (ประกันพัสดุ, SLA) หรือเปิดให้ทุกราย
- **อัตราค่าบริการ:** ส่วนต่างที่รวมร้านคิดในโหมด "ผ่านรวมร้าน"
- **เงิน COD:** รูปแบบการถือและโอน ต้องปรึกษาด้านกฎหมายและภาษี
