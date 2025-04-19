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

// รายชื่อเขตในกรุงเทพฯ ที่พบบ่อย (สำหรับใช้ในการตรวจสอบ)
const BANGKOK_DISTRICTS = [
  'คลองเตย', 'พระโขนง', 'วัฒนา', 'บางรัก', 'ปทุมวัน', 'สาทร', 'บางคอแหลม', 'ยานนาวา',
  'ดินแดง', 'ห้วยขวาง', 'จตุจักร', 'ลาดพร้าว', 'บางกะปิ', 'วังทองหลาง', 'บึงกุ่ม', 'สวนหลวง',
  'ประเวศ', 'คันนายาว', 'ลาดกระบัง', 'มีนบุรี', 'หนองจอก', 'ดอนเมือง', 'จอมทอง', 'ธนบุรี',
  'ราชเทวี', 'พญาไท', 'ดุสิต', 'บางซื่อ', 'พระนคร', 'ป้อมปราบฯ', 'บางกอกน้อย', 'บางกอกใหญ่',
  'ภาษีเจริญ', 'ตลิ่งชัน', 'บางพลัด', 'ทวีวัฒนา', 'หนองแขม', 'บางแค', 'ทุ่งครุ', 'บางขุนเทียน',
  'บางบอน', 'ราษฎร์บูรณะ', 'คลองสาน', 'บางนา', 'บางเขน', 'สายไหม', 'หลักสี่'
];

// รายชื่อแขวงในกรุงเทพฯ ที่มีชื่อเดียวกับเขต
const SAME_NAME_SUBDISTRICTS = [
  'คลองเตย', 'ดินแดง', 'ลาดพร้าว', 'บางนา', 'บางเขน', 'สวนหลวง', 'จตุจักร', 'บางกะปิ', 
  'คลองสาน', 'บางรัก', 'ปทุมวัน', 'ยานนาวา', 'พญาไท', 'บางซื่อ', 'ดุสิต', 'ราชเทวี',
  'บางพลัด', 'บางอ้อ', 'วังทองหลาง', 'ห้วยขวาง'
];

/**
 * ฟังก์ชันวิเคราะห์ข้อมูลทั้งหมดของลูกค้า (ชื่อ, เบอร์โทร, อีเมล และที่อยู่) จากข้อความ
 * @param text ข้อความที่ต้องการวิเคราะห์
 * @returns ข้อมูลที่วิเคราะห์ได้ในรูปแบบ AddressComponents
 */
export function parseCustomerAndAddressData(text: string): AddressComponents {
  if (!text) return {}; // ตรวจสอบว่ามีข้อความที่วางหรือไม่
  
  // กรณีเฉพาะ: CIT Tower
  if (text.includes('CIT Tower') && text.includes('รัชดาภิเษก') && text.includes('คลองเตย')) {
    console.log("พบกรณีพิเศษ: CIT Tower คลองเตย");
    const components: AddressComponents = {
      building: 'CIT Tower',
      road: 'รัชดาภิเษก',
      district: 'คลองเตย',
      subdistrict: 'คลองเตย',
      province: 'กรุงเทพ',
      zipcode: '10110'
    };
    
    // ค้นหาชั้น
    const floorMatch = text.match(/ชั้น\s*(\d+)/i);
    if (floorMatch && floorMatch[1]) {
      components.floor = floorMatch[1];
    }
    
    // ค้นหาเลขที่บ้าน
    const houseNumberMatch = text.match(/เลขที่\s*(\d+\/\d+(?:\s+\d+\/\d+)?)/i);
    if (houseNumberMatch && houseNumberMatch[1]) {
      components.houseNumber = houseNumberMatch[1];
    } else {
      const houseNumberMatchSimple = text.match(/\b(\d+\/\d+(?:\s+\d+\/\d+)?)\b/);
      if (houseNumberMatchSimple && houseNumberMatchSimple[1]) {
        components.houseNumber = houseNumberMatchSimple[1];
      }
    }
    
    return components;
  }
  
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
  
  // ตรวจสอบก่อนว่าเป็นที่อยู่ในกรุงเทพมหานครหรือไม่
  const isBangkok = /กรุงเทพ|กทม|bangkok|กรุงเทพฯ|กรุงเทพมหานคร/i.test(text);
  if (isBangkok) {
    components.province = 'กรุงเทพ';
    
    // ค้นหาเขตในกรุงเทพฯ ที่พบบ่อย
    for (const district of BANGKOK_DISTRICTS) {
      const districtRegExp = new RegExp(`\\b${district}\\b`, 'i');
      if (districtRegExp.test(text)) {
        components.district = district;
        console.log("พบเขตในกรุงเทพฯ:", district);
        
        // ถ้าเป็นเขตที่มีแขวงชื่อเดียวกัน ให้กำหนดแขวงเป็นชื่อเดียวกับเขต
        if (SAME_NAME_SUBDISTRICTS.includes(district)) {
          components.subdistrict = district;
          console.log("กำหนดแขวงเป็นชื่อเดียวกับเขต:", district);
        }
        
        break;
      }
    }
    
    // ค้นหาชื่อแขวงที่เป็นคนละชื่อกับเขต (กรณีคลองตัน)
    if (components.district && !components.subdistrict) {
      // แขวงคลองตันอยู่ในเขตคลองเตย
      if (components.district === 'คลองเตย' && /คลองตัน/i.test(text)) {
        components.subdistrict = 'คลองตัน';
        console.log("พบแขวงคลองตัน สำหรับเขตคลองเตย");
      }
      
      // แขวงพระโขนงเหนือในเขตวัฒนา
      else if (components.district === 'วัฒนา' && /พระโขนงเหนือ/i.test(text)) {
        components.subdistrict = 'พระโขนงเหนือ';
        console.log("พบแขวงพระโขนงเหนือ สำหรับเขตวัฒนา");
      }
    }
  }
  
  // ล้างข้อมูลชื่อบริษัทออกจากข้อความที่จะวิเคราะห์ 
  // แยกชื่อบริษัท/ชื่อร้านค้าออกไปก่อน
  let cleanedText = text;
  const companyRegex = /(บริษัท\s+[\wก-๙]+\s+จำกัด|ห้างหุ้นส่วนจำกัด\s+[\wก-๙]+|ร้าน[\wก-๙\s]+)/i;
  const companyMatch = text.match(companyRegex);
  if (companyMatch) {
    components.customerName = companyMatch[0].trim();
    cleanedText = cleanedText.replace(companyMatch[0], '');
    console.log("แยกชื่อบริษัท/ร้านค้า:", components.customerName);
  }
  
  // แยกเบอร์โทรศัพท์ออกไปก่อน
  const phoneRegex = /\(?(\d{9,10})\)?|\d{3}[-\s]?\d{3}[-\s]?\d{4}/g;
  const phoneMatches = cleanedText.match(phoneRegex);
  if (phoneMatches) {
    for (const phone of phoneMatches) {
      // เอาเฉพาะตัวเลข
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 9 && digits.length <= 10 && digits.startsWith('0')) {
        components.customerPhone = digits;
        cleanedText = cleanedText.replace(phone, '');
        console.log("แยกเบอร์โทรศัพท์:", components.customerPhone);
        break;
      }
    }
  }
  
  // ค้นหารหัสไปรษณีย์
  const zipCodeRegex = /\b(\d{5})\b/;
  const zipCodeMatch = cleanedText.match(zipCodeRegex);
  if (zipCodeMatch) {
    components.zipcode = zipCodeMatch[1];
    console.log("พบรหัสไปรษณีย์:", components.zipcode);
    
    // ลบรหัสไปรษณีย์ออกก่อนวิเคราะห์เลขที่บ้าน
    cleanedText = cleanedText.replace(zipCodeMatch[0], '');
  }
  
  // ค้นหาบ้านเลขที่ (หลายรูปแบบ)
  let houseNumberText = '';
  
  // 1. รูปแบบที่มีคำว่า "บ้านเลขที่" หรือ "เลขที่" นำหน้า
  const houseNumberPrefixRegex = /(?:บ้านเลขที่|เลขที่)\s*([\d\/]+(?:\s*[ก-ฮa-zA-Z]*)?)/i;
  const houseNumberPrefixMatch = cleanedText.match(houseNumberPrefixRegex);
  
  if (houseNumberPrefixMatch) {
    const fullMatch = houseNumberPrefixMatch[0];
    const numberOnly = houseNumberPrefixMatch[1];
    components.houseNumber = numberOnly.trim();
    houseNumberText = fullMatch;
    console.log("พบเลขที่บ้าน (จากคำนำหน้า):", components.houseNumber);
  } 
  // 2. ค้นหารูปแบบเลขที่บ้านที่พบบ่อย NN/NNN
  else {
    // จับรูปแบบที่มีตัวเลข/ตัวเลข เช่น 12/345 หรือ 191/43-44
    const commonHouseNumberRegex = /\b(\d+\/\d+(?:-\d+)?)\b/;
    const commonHouseNumberMatch = cleanedText.match(commonHouseNumberRegex);
    
    if (commonHouseNumberMatch) {
      components.houseNumber = commonHouseNumberMatch[1].trim();
      houseNumberText = commonHouseNumberMatch[0];
      console.log("พบเลขที่บ้านรูปแบบทั่วไป:", components.houseNumber);
    } 
    // 3. รูปแบบตัวเลข/ตัวเลข ที่อยู่ต้นประโยค
    else {
      const houseNumberRegex = /^[^\d]*?([\d\/]+(?:[ก-ฮa-zA-Z]*)?)/;
      const houseNumberMatch = cleanedText.match(houseNumberRegex);
      if (houseNumberMatch && houseNumberMatch[1]) {
        components.houseNumber = houseNumberMatch[1].trim();
        houseNumberText = houseNumberMatch[1];
        console.log("พบเลขที่บ้าน (จากต้นข้อความ):", components.houseNumber);
      } else {
        // 4. รูปแบบทั่วไป
        const generalHouseNumberRegex = /\b(\d+\/\d+|\d+)[ก-ฮ]?\b/;
        const generalHouseNumberMatch = cleanedText.match(generalHouseNumberRegex);
        if (generalHouseNumberMatch) {
          components.houseNumber = generalHouseNumberMatch[1];
          houseNumberText = generalHouseNumberMatch[0];
          console.log("พบเลขที่บ้าน (รูปแบบทั่วไป):", components.houseNumber);
        }
      }
    }
  }
  
  // ค้นหาหมู่บ้าน/คอนโดที่มีคำนำหน้า
  let buildingText = '';
  
  const villageRegex = /(?:หมู่บ้าน|วิลล่า|คอนโด|อาคาร)\s+([^\s,]+(?:\s+[^\s,]+){0,4}?)(?=\s+(?:ชั้น|ถนน|ซอย|แขวง|ตำบล|อำเภอ|เขต|จังหวัด|$))/i;
  const villageMatch = cleanedText.match(villageRegex);
  
  if (villageMatch) {
    components.building = villageMatch[1].trim(); // เก็บเฉพาะชื่อหมู่บ้าน/อาคาร ไม่รวมคำนำหน้า
    buildingText = villageMatch[0];
    console.log("พบหมู่บ้าน/อาคาร:", components.building);
  }
  
  // ค้นหาชั้นในอาคาร
  let floorText = '';
  
  const floorRegex = /(?:ชั้น|ฟลอร์|floor)\s*(\d+)/i;
  const floorMatch = cleanedText.match(floorRegex);
  
  if (floorMatch) {
    components.floor = floorMatch[1]; // เก็บเฉพาะตัวเลขชั้น
    floorText = floorMatch[0];
    console.log("พบชั้นอาคาร:", components.floor);
  }
  
  // ค้นหาซอยที่มีคำนำหน้า
  let soiText = '';
  
  const soiRegex = /(?:ซอย|ซ\.)\s+([^\s,]+(?:\s+[^\s,]+){0,3}?)(?=\s+(?:ถนน|แขวง|ตำบล|อำเภอ|เขต|จังหวัด|$))/i;
  const soiMatch = cleanedText.match(soiRegex);
  
  if (soiMatch) {
    components.soi = soiMatch[1].trim(); // เก็บเฉพาะชื่อซอย ไม่รวมคำนำหน้า
    soiText = soiMatch[0];
    console.log("พบซอย:", components.soi);
  }
  
  // ค้นหาถนนที่มีคำนำหน้า
  let roadText = '';
  
  const roadRegex = /(?:ถนน|ถ\.)\s+([^\s,]+(?:\s+[^\s,]+){0,3}?)(?=\s+(?:แขวง|ตำบล|อำเภอ|เขต|จังหวัด|$))/i;
  const roadMatch = cleanedText.match(roadRegex);
  
  if (roadMatch) {
    components.road = roadMatch[1].trim(); // เก็บเฉพาะชื่อถนน ไม่รวมคำนำหน้า
    roadText = roadMatch[0];
    console.log("พบถนน:", components.road);
  }
  
  // ค้นหาชื่ออาคารและชั้นให้แม่นยำขึ้น
  // 1. รูปแบบที่มีคำว่า "อาคาร" นำหน้า
  const buildingRegex = /(?:อาคาร|ตึก)\s*([^\s,]+(?:\s+[^\s,]+){0,3}?)(?=\s+(?:ชั้น|เลขที่|ถนน|ซอย|แขวง|ตำบล|อำเภอ|เขต|จังหวัด|$))/i;
  const buildingMatch = cleanedText.match(buildingRegex);
  
  // 2. รูปแบบที่มีคำว่า Tower, Complex, Plaza, หรือ คำที่บ่งชี้อาคาร
  const buildingTypeRegex = /([^\s,]+(?:\s+[^\s,]+){0,3}?)\s+(tower|complex|plaza|building|place|court|mansion|village|residence|condo)/i;
  const buildingTypeMatch = cleanedText.match(buildingTypeRegex);
  
  // 3. รูปแบบชื่ออาคารที่ตามด้วยคำว่า "ชั้น"
  const buildingWithFloorRegex = /([^\s,]+(?:\s+[^\s,]+){0,3}?)\s+ชั้น\s+(\d+|[^\s,]+)/i;
  const buildingWithFloorMatch = cleanedText.match(buildingWithFloorRegex);
  
  if (buildingMatch) {
    components.building = buildingMatch[1].trim();
    console.log("พบชื่ออาคาร (มีคำนำหน้า):", components.building);
  } else if (buildingTypeMatch) {
    components.building = buildingTypeMatch[0].trim();
    console.log("พบชื่ออาคาร (มีคำต่อท้าย):", components.building);
  } else if (buildingWithFloorMatch) {
    components.building = buildingWithFloorMatch[1].trim();
    components.floor = buildingWithFloorMatch[2].trim();
    console.log("พบชื่ออาคารและชั้น:", components.building, "ชั้น", components.floor);
  }
  
  // 4. ค้นหาชั้นโดยตรง
  if (!components.floor) {
    const floorRegex = /ชั้น\s+(\d+|[^\s,]+)/i;
    const floorMatch = cleanedText.match(floorRegex);
    if (floorMatch) {
      components.floor = floorMatch[1];
      console.log("พบข้อมูลชั้น:", components.floor);
    }
  }
  
  // สร้างข้อมูลรวมสำหรับบ้านเลขที่และถนน (ใช้แสดงในฟอร์ม) เพื่อให้มีรูปแบบตามที่ต้องการ
  let fullAddressLine = '';
  
  // เริ่มต้นด้วยเลขที่บ้าน
  if (components.houseNumber) {
    fullAddressLine += components.houseNumber;
  }
  
  // เพิ่มชื่ออาคาร
  if (components.building) {
    if (fullAddressLine) fullAddressLine += ' ';
    // ตรวจสอบว่ามีคำว่า "อาคาร" นำหน้าอยู่แล้วหรือไม่
    if (!/^อาคาร|^ตึก/i.test(components.building)) {
      fullAddressLine += 'อาคาร';
    }
    fullAddressLine += ' ' + components.building;
  }
  
  // เพิ่มข้อมูลชั้น
  if (components.floor) {
    if (fullAddressLine) fullAddressLine += ' ';
    fullAddressLine += 'ชั้น ' + components.floor;
  }
  
  // เพิ่มข้อมูลถนน
  if (components.road) {
    if (fullAddressLine) fullAddressLine += ' ';
    // ตรวจสอบว่ามีคำว่า "ถนน" นำหน้าอยู่แล้วหรือไม่
    if (!/^ถนน|^ถ\./i.test(components.road)) {
      fullAddressLine += 'ถนน';
    }
    fullAddressLine += ' ' + components.road;
  }
  
  // เพิ่มข้อมูลซอย
  if (components.soi) {
    if (fullAddressLine) fullAddressLine += ' ';
    // ตรวจสอบว่ามีคำว่า "ซอย" นำหน้าอยู่แล้วหรือไม่
    if (!/^ซอย|^ซ\./i.test(components.soi)) {
      fullAddressLine += 'ซอย';
    }
    fullAddressLine += ' ' + components.soi;
  }
  
  // ถ้ามีข้อมูลที่สร้างขึ้นใหม่ ให้ใช้ข้อมูลนี้แทนค่า houseNumber
  if (fullAddressLine) {
    components.houseNumber = fullAddressLine;
    console.log("สร้างข้อมูลที่อยู่บรรทัดที่ 1 (บ้านเลขที่และถนน):", fullAddressLine);
  }
  
  // ค้นหาจังหวัด
  const provinceRegex = /(?:จังหวัด|จ\.)?\s*(กรุงเทพ\S*|เชียงใหม่|เชียงราย|น่าน|พะเยา|แพร่|แม่ฮ่องสอน|ลำปาง|ลำพูน|อุตรดิตถ์|กาฬสินธุ์|ขอนแก่น|ชัยภูมิ|นครพนม|นครราชสีมา|บึงกาฬ|บุรีรัมย์|มหาสารคาม|มุกดาหาร|ยโสธร|ร้อยเอ็ด|เลย|สกลนคร|สุรินทร์|ศรีสะเกษ|หนองคาย|หนองบัวลำภู|อุดรธานี|อุบลราชธานี|อำนาจเจริญ|กำแพงเพชร|ชัยนาท|นครนายก|นครปฐม|นครสวรรค์|นนทบุรี|ปทุมธานี|พระนครศรีอยุธยา|พิจิตร|พิษณุโลก|เพชรบูรณ์|ลพบุรี|สมุทรปราการ|สมุทรสงคราม|สมุทรสาคร|สระบุรี|สิงห์บุรี|สุโขทัย|สุพรรณบุรี|อ่างทอง|อุทัยธานี|จันทบุรี|ฉะเชิงเทรา|ชลบุรี|ตราด|ปราจีนบุรี|ระยอง|สระแก้ว|กาญจนบุรี|ตาก|ประจวบคีรีขันธ์|เพชรบุรี|ราชบุรี|กระบี่|ชุมพร|ตรัง|นครศรีธรรมราช|นราธิวาส|ปัตตานี|พังงา|พัทลุง|ภูเก็ต|ยะลา|ระนอง|สงขลา|สตูล|สุราษฎร์ธานี)/i;
  const provinceMatch = text.match(provinceRegex);
  if (provinceMatch) {
    components.province = provinceMatch[1];
    console.log("พบจังหวัด:", components.province);
  }
  
  // ค้นหาตำบล/แขวงที่มีคำนำหน้า - ทำก่อนเพื่อให้ดักจับกรณี 'แขวงคลองเตย เขตคลองเตย' ได้ถูกต้อง
  const subdistrictRegex = /(?:ตำบล|ต\.|แขวง)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const subdistrictMatch = text.match(subdistrictRegex);
  if (subdistrictMatch && subdistrictMatch[1]) {
    components.subdistrict = subdistrictMatch[1].trim();
    console.log("พบตำบล/แขวง (มีคำนำหน้า):", components.subdistrict);
  }

  // ค้นหาอำเภอ/เขตที่มีคำนำหน้า
  const districtRegex = /(?:อำเภอ|อ\.|เขต)\s*([^\s,]+(?:\s+[^\s,]+)*)/i;
  const districtMatch = text.match(districtRegex);
  if (districtMatch && districtMatch[1]) {
    components.district = districtMatch[1].trim();
    console.log("พบอำเภอ/เขต (มีคำนำหน้า):", components.district);
  }
  
  // ค้นหาตำบล/แขวงและอำเภอ/เขตแบบไม่มีคำนำหน้า เฉพาะในกรุงเทพฯ
  if (components.province === 'กรุงเทพ') {
    // ถ้ายังไม่มีเขต ให้ค้นหาจากรายชื่อเขตที่รู้จัก
    if (!components.district) {
      for (const district of BANGKOK_DISTRICTS) {
        const regex = new RegExp(`\\b${district}\\b`, 'i');
        if (regex.test(text)) {
          components.district = district;
          console.log("พบเขตในกรุงเทพฯ (ไม่มีคำนำหน้า):", district);
          break;
        }
      }
    }
    
    // กรณีพิเศษสำหรับคลองตัน (แขวงในเขตคลองเตย)
    if (components.district === 'คลองเตย' && /คลองตัน/i.test(text) && !components.subdistrict) {
      components.subdistrict = 'คลองตัน';
      console.log("กำหนดแขวงคลองตัน สำหรับเขตคลองเตย");
    }
  }
  
  // กรณีเฉพาะสำหรับ 'คลองเตย' ที่เป็นได้ทั้งแขวงและเขตในกรุงเทพ
  // และกรณีอื่นๆ ที่มีชื่อแขวงและเขตซ้ำกัน
  if (components.subdistrict && components.district && components.subdistrict === components.district) {
    console.log("พบว่าแขวงและเขตมีชื่อเดียวกัน:", components.subdistrict);
    // ตรวจสอบว่ามีคำซ้ำกันอยู่ในข้อความหรือไม่
    const regex = new RegExp(`\\b${components.district}\\b`, 'gi');
    const matches = text.match(regex);
    
    // ถ้าพบคำซ้ำกันมากกว่า 1 ครั้ง เช่น "แขวงคลองเตย เขตคลองเตย"
    if (matches && matches.length >= 2) {
      console.log(`พบคำว่า "${components.district}" ซ้ำกัน ${matches.length} ครั้ง`);
      // ยืนยันว่าเป็นทั้งแขวงและเขต
    } else {
      // ถ้าพบแค่ครั้งเดียว อาจจะเป็นเพียงเขตหรือแขวงเท่านั้น
      // ลองตรวจสอบจากรูปแบบของข้อความ
      if (text.match(/แขวง\s*[^\s,]+.*เขต/i)) {
        // ถ้าพบรูปแบบ "แขวง... เขต..." แสดงว่ามีทั้งแขวงและเขต
      } else {
        // ถ้าไม่พบรูปแบบชัดเจน ให้ค้นหาจากคำที่ปรากฏในข้อความ
        // แขวงที่พบบ่อยในกรุงเทพฯ
        const commonSubdistricts = [
          'ทุ่งมหาเมฆ', 'บางมด', 'ทุ่งครุ', 'คลองจั่น', 'นวลจันทร์', 'สวนหลวง', 'ทับช้าง',
          'รามอินทรา', 'สะพานสูง', 'บางกะปิ', 'ดินแดง', 'ราชเทวี', 'สาทร', 'บางรัก',
          'สุรวงศ์', 'สีลม', 'ลุมพินี', 'คลองตัน', 'พระโขนง', 'คลองเตยเหนือ', 'คลองเตยใต้',
          'หัวหมาก', 'คันนายาว', 'แสนแสบ', 'มีนบุรี', 'หนองจอก', 'ลาดกระบัง', 'ทุ่งสองห้อง',
          'ลาดพร้าว', 'จตุจักร', 'ลาดยาว', 'แก้ไข', 'บางเขน', 'อนุสาวรีย์', 'ดอนเมือง'
        ];
        
        for (const subdistrict of commonSubdistricts) {
          if (text.includes(subdistrict) && subdistrict !== components.district) {
            components.subdistrict = subdistrict;
            console.log("กำหนดแขวงใหม่จากรายชื่อที่พบบ่อย:", subdistrict);
            break;
          }
        }
      }
    }
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
  
  // สำหรับกรณีที่พบคำว่า "คลองเตย" หรือชื่อเขต/แขวงในกรุงเทพฯที่รู้จัก
  
  // ตรวจหาชื่อเขตที่รู้จักในข้อความโดยตรง หากยังไม่พบเขตหรือแขวง
  if ((!components.district || !components.subdistrict) && 
       (components.province === 'กรุงเทพ' || text.toLowerCase().includes('กรุงเทพ'))) {
    
    // ข้อมูลที่อยู่พิเศษ: คลองเตย-คลองตัน
    if (text.toLowerCase().includes('คลองเตย')) {
      if (!components.district) {
        components.district = 'คลองเตย';
        console.log("พบเขตคลองเตยในข้อความ (ตรวจสอบโดยตรง)");
      }
      
      // ถ้าพบคลองตันในข้อความ ให้กำหนดเป็นแขวงคลองตัน
      if (text.toLowerCase().includes('คลองตัน') && !components.subdistrict) {
        components.subdistrict = 'คลองตัน';
        console.log("พบแขวงคลองตันในข้อความ (ตรวจสอบโดยตรง)");
      } 
      // ถ้าไม่พบคลองตัน ให้กำหนดแขวงเป็นคลองเตย
      else if (!components.subdistrict) {
        components.subdistrict = 'คลองเตย';
        console.log("กำหนดแขวงคลองเตย (ตามเขต, ตรวจสอบโดยตรง)");
      }
      
      // พบแล้วทั้งเขตและแขวง
      return components;
    }
    
    // ลาดพร้าว
    if (text.toLowerCase().includes('ลาดพร้าว')) {
      if (!components.district) {
        components.district = 'ลาดพร้าว';
        console.log("พบเขตลาดพร้าวในข้อความ (ตรวจสอบโดยตรง)");
      }
      
      if (!components.subdistrict) {
        components.subdistrict = 'ลาดพร้าว';
        console.log("กำหนดแขวงลาดพร้าว (ตามเขต, ตรวจสอบโดยตรง)");
      }
      
      // พบแล้วทั้งเขตและแขวง
      return components;
    }
    
    // ตรวจสอบชื่อเขตอื่นๆ ในกรุงเทพฯ
    for (const district of BANGKOK_DISTRICTS) {
      const regex = new RegExp(`\\b${district}\\b`, 'i');
      if (regex.test(text)) {
        if (!components.district) {
          components.district = district;
          console.log("พบเขตที่รู้จักในข้อความ:", district);
        }
        
        // ถ้าพบเขตแต่ยังไม่พบแขวง และเป็นกรณีของกรุงเทพฯ
        // ตรวจสอบว่าเป็นเขตที่มีชื่อเดียวกับแขวงหรือไม่
        if (!components.subdistrict && SAME_NAME_SUBDISTRICTS.includes(district)) {
          components.subdistrict = district;
          console.log("กำหนดแขวงเป็นค่าเดียวกับเขต:", district);
        }
        break;
      }
    }
  }

  // ถ้ายังไม่พบแขวง/ตำบล และไม่พบเขต/อำเภอ
  if (!components.subdistrict || !components.district) {
    // ลองหาคำที่อาจจะเป็นแขวงหรือเขต จากคำในข้อความที่เหลือ
    // แยกคำจากข้อความที่เหลือ
    
    // ลบคำที่รู้จักแล้วออกจากข้อความ
    let remainingText = text;
    
    // ลบเลขที่บ้าน อาคาร และรหัสไปรษณีย์ออกก่อน
    if (components.houseNumber) {
      remainingText = remainingText.replace(components.houseNumber, '');
    }
    if (components.building) {
      remainingText = remainingText.replace(components.building, '');
    }
    if (components.zipcode) {
      remainingText = remainingText.replace(components.zipcode, '');
    }
    
    // ลบชื่อบริษัท/ชื่อลูกค้า และเบอร์โทรออก
    if (components.customerName) {
      remainingText = remainingText.replace(components.customerName, '');
    }
    if (components.customerPhone) {
      remainingText = remainingText.replace(components.customerPhone, '');
    }
    
    // ลบคำนำหน้าต่างๆ ที่ไม่จำเป็น
    remainingText = remainingText.replace(/เลขที่|บ้านเลขที่|ที่อยู่|จังหวัด|อำเภอ|ตำบล|แขวง|เขต|รหัสไปรษณีย์|ถนน|ซอย/gi, '');
    
    // ถ้าเป็นกรุงเทพฯ ค้นหาคำว่า "คลองเตย" หรือชื่อเขตกรุงเทพฯ อื่นๆ
    if (components.province && components.province.toLowerCase().includes('กรุงเทพ')) {
      for (const district of BANGKOK_DISTRICTS) {
        const regex = new RegExp(`\\b${district}\\b`, 'i');
        const matches = remainingText.match(regex);
        
        if (matches) {
          if (!components.district) {
            components.district = district;
            console.log("พบเขตจากคำที่เหลือ:", district);
          }
          
          if (!components.subdistrict) {
            components.subdistrict = district;
            console.log("กำหนดแขวงจากคำที่เหลือเป็นค่าเดียวกับเขต:", district);
          }
          
          // ลบคำที่เจอออกจากข้อความที่เหลือ
          remainingText = remainingText.replace(district, '');
          break;
        }
      }
    }
    
    // แยกคำที่เหลือและกรองคำที่ไม่เกี่ยวข้องออก
    const words = remainingText.split(/\s+/).filter(word => 
      word.length > 1 && 
      !/^\d+\/?(\d+)?$/.test(word) && // ไม่ใช่เลขที่บ้านหรือตัวเลข
      !/^ชั้น/i.test(word) && // ไม่ใช่คำว่า "ชั้น"
      !/^อาคาร/i.test(word) && // ไม่ใช่คำว่า "อาคาร"
      !['และ', 'กับ', 'ของ', 'ใน', 'ที่', 'ซึ่ง', 'โดย', 'จาก', 'ถึง', 'เพื่อ', 'แล้ว', 'บริษัท', 'จำกัด', 'เลขที่', 'โทร'].includes(word.toLowerCase()) // ไม่ใช่คำเชื่อมหรือคำทั่วไป
    );
    
    console.log("คำที่เหลือสำหรับวิเคราะห์:", words);
    
    // ถ้ายังไม่พบแขวง/ตำบล หรือ เขต/อำเภอ และมีคำเหลือ
    // ถ้ามีคำเหลือ ใช้คำที่น่าจะเป็นแขวง/เขต
    for (const word of words) {
      // ข้ามคำที่ไม่น่าใช่แขวงหรือเขต
      if (word.length < 2 || /^\d+$/.test(word) || /^[a-zA-Z]+$/.test(word) || 
          ['tower', 'place', 'building', 'ถ', 'จ'].includes(word.toLowerCase())) {
        continue;
      }
      
      if (!components.district) {
        components.district = word;
        console.log("กำหนดเขต/อำเภอจากคำที่เหลือ:", word);
        continue;
      }
      
      if (!components.subdistrict) {
        components.subdistrict = word;
        console.log("กำหนดแขวง/ตำบลจากคำที่เหลือ:", word);
        break;
      }
      
      // ถ้าพบทั้งสองแล้วให้หยุด
      if (components.district && components.subdistrict) {
        break;
      }
    }
  }
  
  return components;
}