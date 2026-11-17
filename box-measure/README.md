# วัดกล่อง — แอปวัดขนาดกล่องพัสดุด้วย AR

แอปเนทีฟ iOS/Android (Expo + React Native + ViroReact บน ARKit/ARCore)
เล็งกล้องไปที่กล่อง ปักจุด 4 ครั้ง ได้ขนาด 3 ด้านเป็นเซนติเมตร

## วิธีวัด

1. เล็งวงกลมกลางจอไปที่มุมล่างของกล่อง (จุดที่กล่องแตะพื้น) → กด **ปักจุด**
2. เล็งไปที่มุมล่างอีกด้านของขอบเดียวกัน → **ปักจุด** (ได้ด้านที่ 1)
3. ขยับไปด้านข้าง เล็งที่พื้นตรงขอบฝั่งตรงข้าม → **ปักจุด** (ได้ด้านที่ 2)
4. เงยกล้องจนกรอบสีเขียวพอดีขอบบนของกล่อง → **ปักจุด** (ได้ความสูง)
   ถ้า AR จับผิวด้านบนของกล่องได้ จะใช้ความสูงจากผิวนั้นให้อัตโนมัติ

วางกล่องบนพื้นเรียบที่มีลวดลายและแสงพอ ค่าที่ได้คลาดเคลื่อนราว 1–2 ซม.

## รันบนเครื่องจริง

AR ใช้ไม่ได้ใน Expo Go และ simulator/emulator ต้อง build ลงเครื่องจริง

```bash
npm install
npm run android   # ต้องมี Android Studio + เครื่องที่รองรับ ARCore ต่อ USB
npm run ios       # ต้องมี Mac + Xcode + iPhone/iPad ที่รองรับ ARKit
```

หรือ build บนคลาวด์โดยไม่ต้องมี Xcode/Android Studio:

```bash
npx eas-cli@latest build --profile development --platform android
```

## พัฒนา

```bash
npm test            # ทดสอบส่วนคำนวณ (src/geometry.ts, src/store.ts)
npm run typecheck
```

- `src/geometry.ts` — คณิตศาสตร์ล้วน: ฐานสี่เหลี่ยมจาก 3 จุด, ความสูงจากทิศที่กล้องเล็ง
- `src/store.ts` — ลำดับขั้นการวัดและสถานะ
- `src/MeasureScene.tsx` — ฉาก AR (hit test, เส้นกรอบกล่อง)
- `src/MeasureScreen.tsx` — หน้าจอและปุ่ม
