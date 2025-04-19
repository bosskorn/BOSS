/**
 * Location Service
 * บริการให้ข้อมูลจังหวัด อำเภอ และตำบล 
 */

// ฐานข้อมูลจังหวัดในประเทศไทย
export const provinces = [
  { id: "01", name_th: "กรุงเทพมหานคร", name_en: "Bangkok" },
  { id: "02", name_th: "สมุทรปราการ", name_en: "Samut Prakan" },
  { id: "03", name_th: "นนทบุรี", name_en: "Nonthaburi" },
  { id: "04", name_th: "ปทุมธานี", name_en: "Pathum Thani" },
  { id: "05", name_th: "พระนครศรีอยุธยา", name_en: "Phra Nakhon Si Ayutthaya" },
  { id: "06", name_th: "อ่างทอง", name_en: "Ang Thong" },
  { id: "07", name_th: "ลพบุรี", name_en: "Loburi" },
  { id: "08", name_th: "สิงห์บุรี", name_en: "Sing Buri" },
  { id: "09", name_th: "ชัยนาท", name_en: "Chai Nat" },
  { id: "10", name_th: "สระบุรี", name_en: "Saraburi" },
  { id: "11", name_th: "ชลบุรี", name_en: "Chon Buri" },
  { id: "12", name_th: "ระยอง", name_en: "Rayong" },
  { id: "13", name_th: "จันทบุรี", name_en: "Chanthaburi" },
  { id: "14", name_th: "ตราด", name_en: "Trat" },
  { id: "15", name_th: "ฉะเชิงเทรา", name_en: "Chachoengsao" },
  { id: "16", name_th: "ปราจีนบุรี", name_en: "Prachin Buri" },
  { id: "17", name_th: "นครนายก", name_en: "Nakhon Nayok" },
  { id: "18", name_th: "สระแก้ว", name_en: "Sa Kaeo" },
  { id: "19", name_th: "นครราชสีมา", name_en: "Nakhon Ratchasima" },
  { id: "20", name_th: "บุรีรัมย์", name_en: "Buri Ram" },
  { id: "21", name_th: "สุรินทร์", name_en: "Surin" },
  { id: "22", name_th: "ศรีสะเกษ", name_en: "Si Sa Ket" },
  { id: "23", name_th: "อุบลราชธานี", name_en: "Ubon Ratchathani" },
  { id: "24", name_th: "ยโสธร", name_en: "Yasothon" },
  { id: "25", name_th: "ชัยภูมิ", name_en: "Chaiyaphum" },
  { id: "26", name_th: "อำนาจเจริญ", name_en: "Amnat Charoen" },
  { id: "27", name_th: "หนองบัวลำภู", name_en: "Nong Bua Lam Phu" },
  { id: "28", name_th: "ขอนแก่น", name_en: "Khon Kaen" },
  { id: "29", name_th: "อุดรธานี", name_en: "Udon Thani" },
  { id: "30", name_th: "เลย", name_en: "Loei" },
  { id: "31", name_th: "หนองคาย", name_en: "Nong Khai" },
  { id: "32", name_th: "มหาสารคาม", name_en: "Maha Sarakham" },
  { id: "33", name_th: "ร้อยเอ็ด", name_en: "Roi Et" },
  { id: "34", name_th: "กาฬสินธุ์", name_en: "Kalasin" },
  { id: "35", name_th: "สกลนคร", name_en: "Sakon Nakhon" },
  { id: "36", name_th: "นครพนม", name_en: "Nakhon Phanom" },
  { id: "37", name_th: "มุกดาหาร", name_en: "Mukdahan" },
  { id: "38", name_th: "เชียงใหม่", name_en: "Chiang Mai" },
  { id: "39", name_th: "ลำพูน", name_en: "Lamphun" },
  { id: "40", name_th: "ลำปาง", name_en: "Lampang" },
  { id: "41", name_th: "อุตรดิตถ์", name_en: "Uttaradit" },
  { id: "42", name_th: "แพร่", name_en: "Phrae" },
  { id: "43", name_th: "น่าน", name_en: "Nan" },
  { id: "44", name_th: "พะเยา", name_en: "Phayao" },
  { id: "45", name_th: "เชียงราย", name_en: "Chiang Rai" },
  { id: "46", name_th: "แม่ฮ่องสอน", name_en: "Mae Hong Son" },
  { id: "47", name_th: "นครสวรรค์", name_en: "Nakhon Sawan" },
  { id: "48", name_th: "อุทัยธานี", name_en: "Uthai Thani" },
  { id: "49", name_th: "กำแพงเพชร", name_en: "Kamphaeng Phet" },
  { id: "50", name_th: "ตาก", name_en: "Tak" },
  { id: "51", name_th: "สุโขทัย", name_en: "Sukhothai" },
  { id: "52", name_th: "พิษณุโลก", name_en: "Phitsanulok" },
  { id: "53", name_th: "พิจิตร", name_en: "Phichit" },
  { id: "54", name_th: "เพชรบูรณ์", name_en: "Phetchabun" },
  { id: "55", name_th: "ราชบุรี", name_en: "Ratchaburi" },
  { id: "56", name_th: "กาญจนบุรี", name_en: "Kanchanaburi" },
  { id: "57", name_th: "สุพรรณบุรี", name_en: "Suphan Buri" },
  { id: "58", name_th: "นครปฐม", name_en: "Nakhon Pathom" },
  { id: "59", name_th: "สมุทรสาคร", name_en: "Samut Sakhon" },
  { id: "60", name_th: "สมุทรสงคราม", name_en: "Samut Songkhram" },
  { id: "61", name_th: "เพชรบุรี", name_en: "Phetchaburi" },
  { id: "62", name_th: "ประจวบคีรีขันธ์", name_en: "Prachuap Khiri Khan" },
  { id: "63", name_th: "นครศรีธรรมราช", name_en: "Nakhon Si Thammarat" },
  { id: "64", name_th: "กระบี่", name_en: "Krabi" },
  { id: "65", name_th: "พังงา", name_en: "Phangnga" },
  { id: "66", name_th: "ภูเก็ต", name_en: "Phuket" },
  { id: "67", name_th: "สุราษฎร์ธานี", name_en: "Surat Thani" },
  { id: "68", name_th: "ระนอง", name_en: "Ranong" },
  { id: "69", name_th: "ชุมพร", name_en: "Chumphon" },
  { id: "70", name_th: "สงขลา", name_en: "Songkhla" },
  { id: "71", name_th: "สตูล", name_en: "Satun" },
  { id: "72", name_th: "ตรัง", name_en: "Trang" },
  { id: "73", name_th: "พัทลุง", name_en: "Phatthalung" },
  { id: "74", name_th: "ปัตตานี", name_en: "Pattani" },
  { id: "75", name_th: "ยะลา", name_en: "Yala" },
  { id: "76", name_th: "นราธิวาส", name_en: "Narathiwat" },
  { id: "77", name_th: "บึงกาฬ", name_en: "Bueng Kan" }
];

// ฐานข้อมูลอำเภอ
export const districts = {
  "01": [ // กรุงเทพมหานคร
    { id: "01001", name_th: "พระนคร", name_en: "Phra Nakhon", province_id: "01" },
    { id: "01002", name_th: "ดุสิต", name_en: "Dusit", province_id: "01" },
    { id: "01003", name_th: "หนองจอก", name_en: "Nong Chok", province_id: "01" },
    { id: "01004", name_th: "บางรัก", name_en: "Bang Rak", province_id: "01" },
    { id: "01005", name_th: "บางเขน", name_en: "Bang Khen", province_id: "01" },
    { id: "01006", name_th: "บางกะปิ", name_en: "Bang Kapi", province_id: "01" },
    { id: "01007", name_th: "ปทุมวัน", name_en: "Pathum Wan", province_id: "01" },
    { id: "01008", name_th: "ป้อมปราบศัตรูพ่าย", name_en: "Pom Prap Sattru Phai", province_id: "01" },
    { id: "01009", name_th: "พระโขนง", name_en: "Phra Khanong", province_id: "01" },
    { id: "01010", name_th: "มีนบุรี", name_en: "Min Buri", province_id: "01" },
    { id: "01011", name_th: "ลาดกระบัง", name_en: "Lat Krabang", province_id: "01" },
    { id: "01012", name_th: "ยานนาวา", name_en: "Yan Nawa", province_id: "01" },
    { id: "01013", name_th: "สัมพันธวงศ์", name_en: "Samphanthawong", province_id: "01" },
    { id: "01014", name_th: "พญาไท", name_en: "Phaya Thai", province_id: "01" },
    { id: "01015", name_th: "ธนบุรี", name_en: "Thon Buri", province_id: "01" },
    { id: "01016", name_th: "บางกอกใหญ่", name_en: "Bangkok Yai", province_id: "01" },
    { id: "01017", name_th: "ห้วยขวาง", name_en: "Huai Khwang", province_id: "01" },
    { id: "01018", name_th: "คลองสาน", name_en: "Khlong San", province_id: "01" },
    { id: "01019", name_th: "ตลิ่งชัน", name_en: "Taling Chan", province_id: "01" },
    { id: "01020", name_th: "บางกอกน้อย", name_en: "Bangkok Noi", province_id: "01" },
    { id: "01021", name_th: "บางขุนเทียน", name_en: "Bang Khun Thian", province_id: "01" },
    { id: "01022", name_th: "ภาษีเจริญ", name_en: "Phasi Charoen", province_id: "01" },
    { id: "01023", name_th: "หนองแขม", name_en: "Nong Khaem", province_id: "01" },
    { id: "01024", name_th: "ราษฎร์บูรณะ", name_en: "Rat Burana", province_id: "01" },
    { id: "01025", name_th: "บางพลัด", name_en: "Bang Phlat", province_id: "01" },
    { id: "01026", name_th: "ดินแดง", name_en: "Din Daeng", province_id: "01" },
    { id: "01027", name_th: "บึงกุ่ม", name_en: "Bueng Kum", province_id: "01" },
    { id: "01028", name_th: "สาทร", name_en: "Sathon", province_id: "01" },
    { id: "01029", name_th: "บางซื่อ", name_en: "Bang Sue", province_id: "01" },
    { id: "01030", name_th: "จตุจักร", name_en: "Chatuchak", province_id: "01" },
    { id: "01031", name_th: "บางคอแหลม", name_en: "Bang Kho Laem", province_id: "01" },
    { id: "01032", name_th: "ประเวศ", name_en: "Prawet", province_id: "01" },
    { id: "01033", name_th: "คลองเตย", name_en: "Khlong Toei", province_id: "01" },
    { id: "01034", name_th: "สวนหลวง", name_en: "Suan Luang", province_id: "01" }
  ],
  "02": [ // สมุทรปราการ
    { id: "02001", name_th: "เมืองสมุทรปราการ", name_en: "Mueang Samut Prakan", province_id: "02" },
    { id: "02002", name_th: "บางบ่อ", name_en: "Bang Bo", province_id: "02" },
    { id: "02003", name_th: "บางพลี", name_en: "Bang Phli", province_id: "02" },
    { id: "02004", name_th: "พระประแดง", name_en: "Phra Pradaeng", province_id: "02" },
    { id: "02005", name_th: "พระสมุทรเจดีย์", name_en: "Phra Samut Chedi", province_id: "02" },
    { id: "02006", name_th: "บางเสาธง", name_en: "Bang Sao Thong", province_id: "02" }
  ],
  "03": [ // นนทบุรี
    { id: "03001", name_th: "เมืองนนทบุรี", name_en: "Mueang Nonthaburi", province_id: "03" },
    { id: "03002", name_th: "บางกรวย", name_en: "Bang Kruai", province_id: "03" },
    { id: "03003", name_th: "บางใหญ่", name_en: "Bang Yai", province_id: "03" },
    { id: "03004", name_th: "บางบัวทอง", name_en: "Bang Bua Thong", province_id: "03" },
    { id: "03005", name_th: "ไทรน้อย", name_en: "Sai Noi", province_id: "03" },
    { id: "03006", name_th: "ปากเกร็ด", name_en: "Pak Kret", province_id: "03" }
  ],
  "53": [ // พิจิตร (จังหวัดรหัส 53)
    { id: "53001", name_th: "เมืองพิจิตร", name_en: "Mueang Phichit", province_id: "53" },
    { id: "53002", name_th: "วังทรายพูน", name_en: "Wang Sai Phun", province_id: "53" },
    { id: "53003", name_th: "โพธิ์ประทับช้าง", name_en: "Pho Prathap Chang", province_id: "53" },
    { id: "53004", name_th: "ตะพานหิน", name_en: "Taphan Hin", province_id: "53" },
    { id: "53005", name_th: "บางมูลนาก", name_en: "Bang Mun Nak", province_id: "53" },
    { id: "53006", name_th: "โพทะเล", name_en: "Pho Thale", province_id: "53" },
    { id: "53007", name_th: "สามง่าม", name_en: "Sam Ngam", province_id: "53" },
    { id: "53008", name_th: "ทับคล้อ", name_en: "Tap Khlo", province_id: "53" },
    { id: "53009", name_th: "สากเหล็ก", name_en: "Sak Lek", province_id: "53" },
    { id: "53010", name_th: "บึงนาราง", name_en: "Bueng Na Rang", province_id: "53" },
    { id: "53011", name_th: "ดงเจริญ", name_en: "Dong Charoen", province_id: "53" },
    { id: "53012", name_th: "วชิรบารมี", name_en: "Wachirabarami", province_id: "53" }
  ],
  "66": [ // ภูเก็ต (จังหวัดรหัส 66)
    { id: "66001", name_th: "เมืองภูเก็ต", name_en: "Mueang Phuket", province_id: "66" },
    { id: "66002", name_th: "กะทู้", name_en: "Kathu", province_id: "66" },
    { id: "66003", name_th: "ถลาง", name_en: "Thalang", province_id: "66" }
  ],
  "75": [ // ยะลา (จังหวัดรหัส 75)
    { id: "75001", name_th: "เมืองยะลา", name_en: "Mueang Yala", province_id: "75" },
    { id: "75002", name_th: "เบตง", name_en: "Betong", province_id: "75" },
    { id: "75003", name_th: "บันนังสตา", name_en: "Bannang Sata", province_id: "75" },
    { id: "75004", name_th: "ธารโต", name_en: "Than To", province_id: "75" },
    { id: "75005", name_th: "ยะหา", name_en: "Yaha", province_id: "75" },
    { id: "75006", name_th: "รามัน", name_en: "Raman", province_id: "75" },
    { id: "75007", name_th: "กาบัง", name_en: "Kabang", province_id: "75" },
    { id: "75008", name_th: "กรงปินัง", name_en: "Krong Pinang", province_id: "75" }
  ],
  // เพิ่มจังหวัดอื่นๆ ตามความต้องการ
  "38": [ // เชียงใหม่ (จังหวัดรหัส 38)
    { id: "38001", name_th: "เมืองเชียงใหม่", name_en: "Mueang Chiang Mai", province_id: "38" },
    { id: "38002", name_th: "จอมทอง", name_en: "Chom Thong", province_id: "38" },
    { id: "38003", name_th: "แม่แจ่ม", name_en: "Mae Chaem", province_id: "38" },
    { id: "38004", name_th: "เชียงดาว", name_en: "Chiang Dao", province_id: "38" },
    { id: "38005", name_th: "ดอยสะเก็ด", name_en: "Doi Saket", province_id: "38" }
  ],
  "70": [ // สงขลา (จังหวัดรหัส 70)
    { id: "70001", name_th: "เมืองสงขลา", name_en: "Mueang Songkhla", province_id: "70" },
    { id: "70002", name_th: "สทิงพระ", name_en: "Sathing Phra", province_id: "70" },
    { id: "70003", name_th: "จะนะ", name_en: "Chana", province_id: "70" },
    { id: "70004", name_th: "นาทวี", name_en: "Na Thawi", province_id: "70" },
    { id: "70005", name_th: "เทพา", name_en: "Thepha", province_id: "70" },
    { id: "70006", name_th: "สะบ้าย้อย", name_en: "Saba Yoi", province_id: "70" },
    { id: "70007", name_th: "ระโนด", name_en: "Ranot", province_id: "70" },
    { id: "70008", name_th: "กระแสสินธุ์", name_en: "Krasae Sin", province_id: "70" },
    { id: "70009", name_th: "รัตภูมิ", name_en: "Rattaphum", province_id: "70" },
    { id: "70010", name_th: "สะเดา", name_en: "Sadao", province_id: "70" },
    { id: "70011", name_th: "หาดใหญ่", name_en: "Hat Yai", province_id: "70" },
    { id: "70012", name_th: "นาหม่อม", name_en: "Na Mom", province_id: "70" },
    { id: "70013", name_th: "ควนเนียง", name_en: "Khuan Niang", province_id: "70" },
    { id: "70014", name_th: "บางกล่ำ", name_en: "Bang Klam", province_id: "70" },
    { id: "70015", name_th: "สิงหนคร", name_en: "Singhanakhon", province_id: "70" },
    { id: "70016", name_th: "คลองหอยโข่ง", name_en: "Khlong Hoi Khong", province_id: "70" }
  ]
};

// ฐานข้อมูลตำบล (ตัวอย่างเพียงบางส่วน)
export const subdistricts = {
  "01001": [ // พระนคร
    { id: "0100101", name_th: "พระบรมมหาราชวัง", name_en: "Phra Borom Maha Ratchawang", district_id: "01001", zip_code: "10200" },
    { id: "0100102", name_th: "วังบูรพาภิรมย์", name_en: "Wang Burapha Phirom", district_id: "01001", zip_code: "10200" },
    { id: "0100103", name_th: "วัดราชบพิธ", name_en: "Wat Ratchabophit", district_id: "01001", zip_code: "10200" }
  ],
  "01002": [ // ดุสิต
    { id: "0100201", name_th: "ดุสิต", name_en: "Dusit", district_id: "01002", zip_code: "10300" },
    { id: "0100202", name_th: "วชิรพยาบาล", name_en: "Wachiraphayaban", district_id: "01002", zip_code: "10300" },
    { id: "0100203", name_th: "สวนจิตรลดา", name_en: "Suan Chit Lada", district_id: "01002", zip_code: "10300" }
  ],
  "03001": [ // เมืองนนทบุรี
    { id: "0300101", name_th: "สวนใหญ่", name_en: "Suan Yai", district_id: "03001", zip_code: "11000" },
    { id: "0300102", name_th: "ตลาดขวัญ", name_en: "Talat Khwan", district_id: "03001", zip_code: "11000" },
    { id: "0300103", name_th: "บางเขน", name_en: "Bang Khen", district_id: "03001", zip_code: "11000" }
  ]
  // สามารถเพิ่มตำบลของอำเภออื่น ๆ ได้ตามต้องการ
};

/**
 * ดึงข้อมูลจังหวัดทั้งหมด
 */
export function getAllProvinces() {
  return provinces;
}

/**
 * ดึงข้อมูลอำเภอตามรหัสจังหวัด
 */
export function getDistrictsByProvinceId(provinceId: string) {
  // ใช้ as เพื่อแก้ไข TypeScript error
  return (districts as Record<string, { id: string; name_th: string; name_en: string; province_id: string; }[]>)[provinceId] || [];
}

/**
 * ดึงข้อมูลตำบลตามรหัสอำเภอ
 */
export function getSubdistrictsByDistrictId(districtId: string) {
  // ใช้ as เพื่อแก้ไข TypeScript error
  return (subdistricts as Record<string, { id: string; name_th: string; name_en: string; district_id: string; zip_code: string; }[]>)[districtId] || [];
}