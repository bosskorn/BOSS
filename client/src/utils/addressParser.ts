// ฟังก์ชันวิเคราะห์ข้อมูลที่อยู่แบบปรับปรุงใหม่
// สามารถแยกแยะ ชื่อลูกค้า, เบอร์โทร, ที่อยู่, จังหวัด, รหัสไปรษณีย์ ฯลฯ

export interface AddressComponents {
  customerName?: string;
  customerPhone?: string;
  houseNumber?: string;
  village?: string;
  soi?: string;
  road?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  zipcode?: string;
  building?: string;
  floor?: string;
  roomNumber?: string;
  storeName?: string;
}

/**
 * ฟังก์ชันวิเคราะห์ข้อมูลทั้งหมดของลูกค้า (ชื่อ, เบอร์โทร, อีเมล และที่อยู่) จากข้อความ
 * @param text ข้อความที่ต้องการวิเคราะห์
 * @returns ข้อมูลที่วิเคราะห์ได้ในรูปแบบ AddressComponents
 */
export function parseCustomerAndAddressData(text: string): AddressComponents {
  if (!text) return {}; // ตรวจสอบว่ามีข้อความที่วางหรือไม่
  
  // เก็บข้อความเดิมไว้
  const originalText = text;
  const components: AddressComponents = {};
  
  // ค้นหาเบอร์โทรศัพท์ก่อน ควรทำก่อนที่จะวิเคราะห์ชื่อ
  let phoneFound = false;
  let foundPhoneNumber = "";
  let phonePosition = -1;
  let phoneLength = 0;
  
  // 1. รูปแบบเบอร์โทรที่ถูกครอบด้วยวงเล็บ (เช่น (0819876543))
  const phoneInParenthesesRegex = /\((\d{9,10})\)/;
  const phoneInParenthesesMatch = text.match(phoneInParenthesesRegex);
  if (phoneInParenthesesMatch && !phoneFound) {
    foundPhoneNumber = phoneInParenthesesMatch[1];
    if (foundPhoneNumber.startsWith('0') && foundPhoneNumber.length >= 9 && foundPhoneNumber.length <= 10) {
      components.customerPhone = foundPhoneNumber;
      phoneFound = true;
      phonePosition = text.indexOf(phoneInParenthesesMatch[0]);
      phoneLength = phoneInParenthesesMatch[0].length;
      console.log("พบเบอร์โทรจากวงเล็บ:", foundPhoneNumber);
    }
  }
  
  // 2. รูปแบบที่มีคำนำหน้า (โทร, เบอร์, tel:, etc.)
  if (!phoneFound) {
    const phoneWithPrefixRegex = /(?:โทร|เบอร์|tel|phone|:|\+66)[:\s]*(0\d[\d\s-]{7,})/i;
    const phoneWithPrefixMatch = text.match(phoneWithPrefixRegex);
    if (phoneWithPrefixMatch) {
      foundPhoneNumber = phoneWithPrefixMatch[1].replace(/[\s-]/g, '');
      if (foundPhoneNumber.startsWith('0') && foundPhoneNumber.length >= 9 && foundPhoneNumber.length <= 10) {
        components.customerPhone = foundPhoneNumber;
        phoneFound = true;
        phonePosition = text.indexOf(phoneWithPrefixMatch[0]);
        phoneLength = phoneWithPrefixMatch[0].length;
        console.log("พบเบอร์โทรจากคำนำหน้า:", foundPhoneNumber);
      }
    }
  }
  
  // 3. รูปแบบเบอร์โทรแบบง่าย (เช่น 0819876543)
  if (!phoneFound) {
    const simplePhoneRegex = /\b(0\d{8,9})\b/;
    const simplePhoneMatch = text.match(simplePhoneRegex);
    if (simplePhoneMatch) {
      foundPhoneNumber = simplePhoneMatch[1];
      components.customerPhone = foundPhoneNumber;
      phoneFound = true;
      phonePosition = text.indexOf(simplePhoneMatch[0]);
      phoneLength = simplePhoneMatch[0].length;
      console.log("พบเบอร์โทรแบบง่าย:", foundPhoneNumber);
    }
  }
  
  // 4. ค้นหาเบอร์โทรจากรูปแบบที่มีขีด ช่องว่าง หรือจุด (เช่น 081-987-6543)
  if (!phoneFound) {
    const formattedPhoneRegex = /\b(0\d{1,2}[- .]\d{3,4}[- .]\d{3,4})\b/;
    const formattedPhoneMatch = text.match(formattedPhoneRegex);
    if (formattedPhoneMatch) {
      foundPhoneNumber = formattedPhoneMatch[1].replace(/[- .]/g, '');
      if (foundPhoneNumber.length >= 9 && foundPhoneNumber.length <= 10) {
        components.customerPhone = foundPhoneNumber;
        phoneFound = true;
        phonePosition = text.indexOf(formattedPhoneMatch[0]);
        phoneLength = formattedPhoneMatch[0].length;
        console.log("พบเบอร์โทรแบบมีรูปแบบ:", foundPhoneNumber);
      }
    }
  }
  
  // แยกข้อความตามบรรทัด
  let lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  // จัดการกับกรณีที่ข้อมูลถูกวางในบรรทัดเดียวกัน คั่นด้วยเครื่องหมายจุลภาค
  if (lines.length <= 1) {
    // แยกข้อความด้วยเครื่องหมายจุลภาคหรือช่องว่าง (เพิ่มเติม)
    const parts = text.split(/[,|]/).map(part => part.trim()).filter(Boolean);
    if (parts.length > 1) {
      lines = parts;
    }
  }
  
  // ตัดเครื่องหมายอัญประกาศหรือเครื่องหมายคำพูดออกจากข้อความทั้งหมด
  lines = lines.map(line => line.replace(/["']/g, ''));
  
  console.log('ข้อความที่วิเคราะห์ (หลังการทำความสะอาด):', lines);

  // ค้นหาชื่อลูกค้า ตามรูปแบบต่างๆ
  let nameExtracted = false;
  let namePosition = -1;
  let nameLength = 0;
  
  // 1. รูปแบบชื่อบริษัท: "บริษัท XXX จำกัด"
  if (!nameExtracted && !components.customerName) {
    const companyRegex = /(บริษัท\s+[\wก-๙]+\s+จำกัด)/i;
    const companyMatch = text.match(companyRegex);
    
    if (companyMatch) {
      components.customerName = companyMatch[1];
      nameExtracted = true;
      namePosition = text.indexOf(companyMatch[1]);
      nameLength = companyMatch[1].length;
      console.log("พบชื่อบริษัท:", companyMatch[1]);
    }
  }
  
  // 2. รูปแบบที่พบบ่อยสำหรับข้อมูลที่มีชื่อร้านค้า+ชื่อคน ตามด้วยเบอร์โทรในวงเล็บ
  // เช่น "ร้านค้า A (น้องบี) (0819876543)"
  if (!nameExtracted && lines.length >= 1 && !components.customerName) {
    // ใช้ regex ที่มีความแม่นยำมากขึ้น
    const shopNameWithPersonRegex = /^([^(]+)(?:\s*\(([^)]+)\))?/;
    const shopNameMatch = lines[0].match(shopNameWithPersonRegex);
    
    if (shopNameMatch) {
      let fullName = '';
      
      // มีชื่อร้านค้า/บุคคล
      if (shopNameMatch[1] && shopNameMatch[1].trim()) {
        fullName = shopNameMatch[1].trim();
      }
      
      // มีชื่อคนในวงเล็บ
      if (shopNameMatch[2] && shopNameMatch[2].trim() && shopNameMatch[2].trim().length < 15) {
        // ตรวจสอบว่าในวงเล็บไม่ใช่เบอร์โทร
        if (!/^\d+$/.test(shopNameMatch[2].trim())) {
          if (fullName) {
            fullName += ' (' + shopNameMatch[2].trim() + ')';
          } else {
            fullName = shopNameMatch[2].trim();
          }
        }
      }
      
      // ถ้าพบชื่อและเป็นชื่อที่สมเหตุสมผล (ไม่ใช่ส่วนของที่อยู่)
      const addressKeywords = ['ตำบล', 'แขวง', 'อำเภอ', 'เขต', 'จังหวัด', 'รหัสไปรษณีย์'];
      if (fullName && !addressKeywords.some(word => fullName.includes(word))) {
        components.customerName = fullName;
        nameExtracted = true;
        namePosition = text.indexOf(fullName);
        nameLength = fullName.length;
        console.log("พบชื่อลูกค้ารูปแบบร้านค้า/บุคคล:", fullName);
      }
    }
  }
  
  // 3. รูปแบบคุณ/นาย/นาง ตามด้วยชื่อ
  if (!nameExtracted && !components.customerName) {
    const titleNameRegex = /(คุณ|นาย|นาง|น\.ส\.|น\.สาว|ดร\.|ดอกเตอร์|อาจารย์)\s+([\wก-๙\s]{2,}?)(?=\s+(?:โทร|เบอร์|0\d|เลข|บ้าน|ถนน|ซอย|\d|$))/i;
    const titleNameMatch = text.match(titleNameRegex);
    
    if (titleNameMatch) {
      const fullName = titleNameMatch[0].trim();
      components.customerName = fullName;
      nameExtracted = true;
      namePosition = text.indexOf(fullName);
      nameLength = fullName.length;
      console.log("พบชื่อลูกค้าแบบมีคำนำหน้า:", fullName);
    }
  }
  
  // 4. ถ้ายังไม่พบชื่อลูกค้า ลองใช้บรรทัดแรก
  if (!nameExtracted && lines.length >= 1 && !components.customerName) {
    // ตรวจสอบบรรทัดแรกว่าเป็นชื่อลูกค้าหรือไม่
    // ข้ามถ้าเป็นเบอร์โทรศัพท์ (ไม่ใช่ตัวเลขทั้งบรรทัด)
    const firstLine = lines[0].trim();
    if (!/^\d+$/.test(firstLine)) {
      // ตรวจสอบว่าไม่ใช่ที่อยู่ (ไม่มีคำที่เกี่ยวข้องกับที่อยู่)
      const addressRelatedWords = ['บ้านเลขที่', 'เลขที่', 'ซอย', 'ซ.', 'ถนน', 'ถ.', 'หมู่', 'ม.', 'ตำบล', 'ต.', 'แขวง', 'อำเภอ', 'อ.', 'เขต', 'จังหวัด', 'จ.', 'รหัสไปรษณีย์'];
      const isLikelyAddress = addressRelatedWords.some(word => firstLine.includes(word));
      
      // ถ้าไม่น่าจะเป็นที่อยู่ ให้ถือว่าเป็นชื่อลูกค้า
      if (!isLikelyAddress && firstLine.length < 50) { // ถ้าความยาวไม่มากเกินไป
        components.customerName = firstLine;
        nameExtracted = true;
        namePosition = text.indexOf(firstLine);
        nameLength = firstLine.length;
        console.log("พบชื่อลูกค้าจากบรรทัดแรก:", firstLine);
      }
    }
  }
  
  // ระวัง: เมื่อวิเคราะห์ข้อมูลลูกค้าแล้ว ให้เอาเฉพาะส่วนของที่อยู่ไปวิเคราะห์ต่อ
  // กรองข้อมูลที่เป็นชื่อและเบอร์โทรออกก่อนวิเคราะห์ที่อยู่ เพื่อลดความสับสน
  let addressOnly = originalText;
  
  // ลบส่วนที่เป็นชื่อออก ถ้ารู้ตำแหน่ง
  if (namePosition >= 0 && nameLength > 0) {
    addressOnly = addressOnly.substring(0, namePosition) + ' ' + addressOnly.substring(namePosition + nameLength);
  } else if (components.customerName) {
    // ถ้าไม่รู้ตำแหน่งแน่ชัด ลองใช้การแทนที่
    addressOnly = addressOnly.replace(components.customerName, '');
  }
  
  // ลบส่วนที่เป็นเบอร์โทรออก ถ้ารู้ตำแหน่ง
  if (phonePosition >= 0 && phoneLength > 0) {
    addressOnly = addressOnly.substring(0, phonePosition) + ' ' + addressOnly.substring(phonePosition + phoneLength);
  } else if (components.customerPhone) {
    // ถ้าไม่รู้ตำแหน่งแน่ชัด ลองใช้การแทนที่
    addressOnly = addressOnly.replace(components.customerPhone, '');
  }
  
  // ลบวงเล็บว่างที่เหลือซึ่งอาจเกิดจากการลบเบอร์โทร
  addressOnly = addressOnly.replace(/\(\s*\)/g, '');
  
  // ปรับรูปแบบข้อความ ลบบรรทัดว่าง และช่องว่างไม่จำเป็น
  addressOnly = addressOnly.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // วิเคราะห์ที่อยู่แยกเป็นส่วนๆ (ส่งเฉพาะข้อมูลที่อยู่ไปวิเคราะห์)
  const addressComponents = parseAddressFromText(addressOnly);
  
  // รวมผลลัพธ์การวิเคราะห์ (ทั้งข้อมูลลูกค้าและที่อยู่)
  return { ...components, ...addressComponents };
}

/**
 * ฟังก์ชันวิเคราะห์ที่อยู่แยกเป็นส่วนๆ
 * @param text ข้อความที่อยู่ที่ต้องการวิเคราะห์
 * @returns ข้อมูลที่อยู่ที่วิเคราะห์ได้ในรูปแบบ AddressComponents
 */
export function parseAddressFromText(text: string): AddressComponents {
  const components: AddressComponents = {};
  console.log("กำลังวิเคราะห์ที่อยู่:", text);
  
  // ค้นหารหัสไปรษณีย์
  const zipCodeRegex = /\b(\d{5})\b/;
  const zipCodeMatch = text.match(zipCodeRegex);
  if (zipCodeMatch) {
    components.zipcode = zipCodeMatch[1];
    console.log("พบรหัสไปรษณีย์:", components.zipcode);
  }
  
  // ค้นหาบ้านเลขที่ (หลายรูปแบบ)
  // 1. รูปแบบที่มีคำว่า "บ้านเลขที่" หรือ "เลขที่" นำหน้า
  const houseNumberPrefixRegex = /(?:บ้านเลขที่|เลขที่)\s*([\d\/]+(?:\s*[ก-ฮa-zA-Z]*)?)/i;
  const houseNumberPrefixMatch = text.match(houseNumberPrefixRegex);
  if (houseNumberPrefixMatch) {
    components.houseNumber = houseNumberPrefixMatch[0]; // เก็บทั้งคำว่า "เลขที่" และตัวเลข
    console.log("พบเลขที่บ้าน (จากคำนำหน้า):", components.houseNumber);
  } 
  // 2. รูปแบบตัวเลข/ตัวเลข เช่น 123/45 ที่อยู่ต้นประโยค
  else {
    const houseNumberRegex = /^[^\d]*([\d\/]+(?:[ก-ฮa-zA-Z]*)?)/;
    const houseNumberMatch = text.match(houseNumberRegex);
    if (houseNumberMatch && houseNumberMatch[1]) {
      components.houseNumber = houseNumberMatch[1];
      console.log("พบเลขที่บ้าน (จากต้นข้อความ):", components.houseNumber);
    } else {
      // 3. รูปแบบทั่วไป
      const generalHouseNumberRegex = /\b(\d+\/\d+|\d+)\b/;
      const generalHouseNumberMatch = text.match(generalHouseNumberRegex);
      if (generalHouseNumberMatch) {
        components.houseNumber = generalHouseNumberMatch[1];
        console.log("พบเลขที่บ้าน (รูปแบบทั่วไป):", components.houseNumber);
      }
    }
  }
  
  // ค้นหาหมู่บ้าน/คอนโดที่มีคำนำหน้า
  const villageRegex = /(?:หมู่บ้าน|วิลล่า|คอนโด|อาคาร)\s+([^,]+?)(?=\s+(?:ชั้น|เลข|ถนน|ซอย|แขวง|ตำบล|อำเภอ|เขต|จังหวัด|$))/i;
  const villageMatch = text.match(villageRegex);
  if (villageMatch) {
    components.village = villageMatch[0]; // เก็บทั้งคำนำหน้าและชื่อหมู่บ้าน
    console.log("พบหมู่บ้าน/อาคาร (จากคำนำหน้า):", components.village);
  }
  
  // ค้นหาชั้นในอาคาร
  const floorRegex = /(?:ชั้น|ฟลอร์|floor)\s*(\d+)/i;
  const floorMatch = text.match(floorRegex);
  if (floorMatch) {
    components.floor = floorMatch[0];
    console.log("พบชั้นอาคาร:", components.floor);
  }
  
  // ค้นหาซอยที่มีคำนำหน้า
  const soiRegex = /(?:ซอย|ซ\.)\s+([^,]+?)(?=\s+(?:ถนน|แขวง|ตำบล|อำเภอ|เขต|จังหวัด|$))/i;
  const soiMatch = text.match(soiRegex);
  if (soiMatch) {
    components.soi = soiMatch[0]; // เก็บทั้งคำนำหน้าและชื่อซอย
    console.log("พบซอย (จากคำนำหน้า):", components.soi);
  }
  
  // ค้นหาถนนที่มีคำนำหน้า
  const roadRegex = /(?:ถนน|ถ\.)\s+([^,]+?)(?=\s+(?:แขวง|ตำบล|อำเภอ|เขต|จังหวัด|$))/i;
  const roadMatch = text.match(roadRegex);
  if (roadMatch) {
    components.road = roadMatch[0]; // เก็บทั้งคำนำหน้าและชื่อถนน
    console.log("พบถนน (จากคำนำหน้า):", components.road);
  }
  
  // ค้นหาจังหวัด
  const provinceRegex = /(?:จังหวัด|จ\.)?\s*(กรุงเทพ\S*|เชียงใหม่|เชียงราย|น่าน|พะเยา|แพร่|แม่ฮ่องสอน|ลำปาง|ลำพูน|อุตรดิตถ์|กาฬสินธุ์|ขอนแก่น|ชัยภูมิ|นครพนม|นครราชสีมา|บึงกาฬ|บุรีรัมย์|มหาสารคาม|มุกดาหาร|ยโสธร|ร้อยเอ็ด|เลย|สกลนคร|สุรินทร์|ศรีสะเกษ|หนองคาย|หนองบัวลำภู|อุดรธานี|อุบลราชธานี|อำนาจเจริญ|กำแพงเพชร|ชัยนาท|นครนายก|นครปฐม|นครสวรรค์|นนทบุรี|ปทุมธานี|พระนครศรีอยุธยา|พิจิตร|พิษณุโลก|เพชรบูรณ์|ลพบุรี|สมุทรปราการ|สมุทรสงคราม|สมุทรสาคร|สระบุรี|สิงห์บุรี|สุโขทัย|สุพรรณบุรี|อ่างทอง|อุทัยธานี|จันทบุรี|ฉะเชิงเทรา|ชลบุรี|ตราด|ปราจีนบุรี|ระยอง|สระแก้ว|กาญจนบุรี|ตาก|ประจวบคีรีขันธ์|เพชรบุรี|ราชบุรี|กระบี่|ชุมพร|ตรัง|นครศรีธรรมราช|นราธิวาส|ปัตตานี|พังงา|พัทลุง|ภูเก็ต|ยะลา|ระนอง|สงขลา|สตูล|สุราษฎร์ธานี)/i;
  const provinceMatch = text.match(provinceRegex);
  if (provinceMatch) {
    components.province = provinceMatch[1];
    console.log("พบจังหวัด:", components.province);
  }
  
  // ค้นหาอำเภอ/เขตที่มีคำนำหน้า
  const districtRegex = /(?:อำเภอ|อ\.|เขต)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const districtMatch = text.match(districtRegex);
  if (districtMatch) {
    components.district = districtMatch[1];
    console.log("พบอำเภอ/เขต (มีคำนำหน้า):", components.district);
  }
  
  // ค้นหาตำบล/แขวงที่มีคำนำหน้า
  const subdistrictRegex = /(?:ตำบล|ต\.|แขวง)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const subdistrictMatch = text.match(subdistrictRegex);
  if (subdistrictMatch) {
    components.subdistrict = subdistrictMatch[1];
    console.log("พบตำบล/แขวง (มีคำนำหน้า):", components.subdistrict);
  }
  
  // สำหรับกรุงเทพฯ มักมีการตั้งชื่อเขตซ้ำกัน
  // เช่น มีคำว่า "ลาดพร้าว" ทั้งในชื่อถนน, แขวง, และเขต
  if ((components.province && components.province.toLowerCase().includes('กรุงเทพ')) || 
      (text.toLowerCase().includes('กรุงเทพ'))) {
    // ค้นหาคำที่น่าจะเป็นเขตที่ปรากฏหลายครั้ง
    const potentialDistricts = [
      'จตุจักร', 'ดินแดง', 'ราชเทวี', 'พญาไท', 'ดุสิต', 'บางซื่อ', 'สาทร', 'คลองเตย', 'พระโขนง', 
      'วัฒนา', 'บางรัก', 'บางคอแหลม', 'ยานนาวา', 'ลาดพร้าว', 'ห้วยขวาง', 'บางกะปิ', 'วังทองหลาง',
      'บางนา', 'บางเขน', 'สายไหม', 'จอมทอง', 'บางแค', 'ราษฎร์บูรณะ', 'ธนบุรี', 'ตลิ่งชัน', 'บางกอกน้อย',
      'บางกอกใหญ่', 'หนองแขม', 'ทุ่งครุ', 'คลองสาน', 'ภาษีเจริญ', 'ประเวศ', 'สะพานสูง', 'มีนบุรี', 'ลาดกระบัง',
      'หนองจอก', 'คลองสามวา', 'บางพลัด', 'ทวีวัฒนา', 'บึงกุ่ม', 'สวนหลวง', 'ดอนเมือง', 'หลักสี่', 'บางบอน'
    ];
    
    for (const district of potentialDistricts) {
      const regex = new RegExp('\\b' + district + '\\b', 'gi');
      const matches = text.match(regex);
      
      if (matches && matches.length >= 1) {
        console.log(`พบคำว่า "${district}" จำนวน ${matches.length} ครั้ง`);
        // ถ้าพบคำนี้มากกว่า 1 ครั้ง หรือคำนี้อยู่ในถนน หรือยังไม่ได้กำหนดเขต/อำเภอ
        if (matches.length > 1 || (components.road && components.road.toLowerCase().includes(district.toLowerCase())) || !components.district) {
          components.district = district;
          
          // ถ้ายังไม่พบแขวง/ตำบล ให้ใช้ค่าเดียวกันกับเขต/อำเภอสำหรับกรุงเทพฯ
          if (!components.subdistrict) {
            components.subdistrict = district;
            console.log("กำหนดแขวง/ตำบลเป็นค่าเดียวกับเขต/อำเภอ:", district);
          }
          
          console.log("กำหนดเป็นเขต/อำเภอ:", district);
          break; // หยุดการวนลูป เมื่อพบเขต/อำเภอที่ตรงกัน
        }
      }
    }
  }
  
  // สำหรับต่างจังหวัด: ตรวจสอบอำเภอตามรายชื่ออำเภอที่มีชื่อเสียง
  if (!components.district && components.province && !components.province.toLowerCase().includes('กรุงเทพ')) {
    const commonDistricts = [
      'เมือง', 'บางละมุง', 'เกาะสมุย', 'หาดใหญ่', 'เชียงแสน', 'แม่ริม', 'เชียงของ', 'แม่สาย', 
      'แม่สอด', 'พัทยา', 'ชะอำ', 'หัวหิน', 'เขาค้อ', 'ปาย', 'เกาะพะงัน', 'เกาะลันตา', 'แม่สะเรียง',
      'สัตหีบ', 'กระบี่', 'ป่าตอง', 'กมลา', 'ตะกั่วป่า'
    ];
    
    for (const district of commonDistricts) {
      if (text.toLowerCase().includes(district.toLowerCase())) {
        components.district = district;
        console.log("พบอำเภอจากรายชื่ออำเภอที่มีชื่อเสียง:", district);
        break;
      }
    }
  }
  
  // ถ้ายังไม่พบแขวง/ตำบล และไม่พบเขต/อำเภอ
  if (!components.subdistrict && !components.district) {
    // ลองหาคำที่อาจจะเป็นแขวงหรือเขต จากคำในข้อความที่เหลือ
    // แยกคำจากข้อความที่เหลือ
    
    // ลบคำที่รู้จักแล้วออกจากข้อความ
    let remainingText = text;
    for (const [key, value] of Object.entries(components)) {
      if (value) {
        remainingText = remainingText.replace(value, '');
      }
    }
    
    // แยกคำที่เหลือ
    const words = remainingText.split(/\s+/).filter(word => 
      word.length > 1 && 
      !/^\d+$/.test(word) && // ไม่ใช่ตัวเลขล้วน
      !['และ', 'กับ', 'ของ', 'ใน', 'ที่', 'ซึ่ง', 'โดย', 'จาก', 'ถึง', 'เพื่อ', 'แล้ว', 'บริษัท', 'จำกัด', 'เลขที่', 'โทร'].includes(word.toLowerCase()) // ไม่ใช่คำเชื่อมหรือคำทั่วไป
    );
    
    console.log("คำที่เหลือสำหรับวิเคราะห์:", words);
    
    // ถ้ามีคำเหลือ ใช้คำแรกเป็นแขวง/ตำบล และคำที่สองเป็นเขต/อำเภอ
    if (words.length >= 2) {
      // หลีกเลี่ยงการซ้ำซ้อน
      if (!components.district && words[0] && words[0].length > 1) {
        components.district = words[0];
        console.log("กำหนดเขต/อำเภอจากคำที่เหลือลำดับที่ 1:", components.district);
      }
      
      if (!components.subdistrict && words[1] && words[1].length > 1) {
        components.subdistrict = words[1];
        console.log("กำหนดแขวง/ตำบลจากคำที่เหลือลำดับที่ 2:", components.subdistrict);
      }
    } else if (words.length === 1 && words[0] && words[0].length > 1) {
      // ถ้ามีแค่คำเดียว ให้ใช้เป็นแขวง/ตำบล
      if (!components.subdistrict) {
        components.subdistrict = words[0];
        console.log("กำหนดแขวง/ตำบลจากคำที่เหลือเพียงคำเดียว:", components.subdistrict);
      }
    }
  }
  
  return components;
}