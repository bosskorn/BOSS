import * as xlsx from 'xlsx';
import * as csv from 'csv-parser';
import * as fs from 'fs';

/**
 * แปลง Excel แถวเป็นข้อมูล JavaScript Object
 */
function normalizeExcelRow(row: any) {
  const normalized: Record<string, any> = {};
  
  // กรณีไม่มีข้อมูลหรือเป็น undefined
  if (!row) return normalized;
  
  // วนลูปทุก key
  Object.keys(row).forEach(key => {
    // ข้ามฟิลด์ที่ไม่มีค่า
    if (row[key] === undefined || row[key] === null || row[key] === '') {
      return;
    }
    
    // แปลงชื่อฟิลด์ให้เป็น camelCase
    const normalizedKey = key.trim().toLowerCase()
      .replace(/\s+(\w)/g, (_, c) => c.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '');
    
    // แปลงค่าให้เป็นรูปแบบที่เหมาะสม
    let value = row[key];
    
    // แปลงวันที่
    if (value instanceof Date) {
      value = value.toISOString();
    } 
    // แปลงตัวเลข
    else if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      if (value.includes('.')) {
        value = parseFloat(value);
      } else {
        value = parseInt(value);
      }
    }
    
    normalized[normalizedKey] = value;
  });
  
  return normalized;
}

/**
 * ประมวลผลไฟล์ Excel
 */
async function processExcelFile(filePath: string): Promise<{ records: number, data: any[] }> {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // แปลงข้อมูลเป็น JSON
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: null, raw: false });
  
  // ทำความสะอาดข้อมูล
  const normalizedData = jsonData
    .map(row => normalizeExcelRow(row))
    .filter(row => Object.keys(row).length > 0); // กรองแถวที่ไม่มีข้อมูลออก
  
  return {
    records: normalizedData.length,
    data: normalizedData
  };
}

/**
 * ประมวลผลไฟล์ CSV
 */
async function processCsvFile(filePath: string): Promise<{ records: number, data: any[] }> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(normalizeExcelRow(data)))
      .on('end', () => {
        // กรองแถวที่ไม่มีข้อมูลออก
        const filteredResults = results.filter(row => Object.keys(row).length > 0);
        
        resolve({
          records: filteredResults.length,
          data: filteredResults
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * ประมวลผลไฟล์ตามนามสกุล
 */
export const processFile = async (filePath: string, fileExt: string): Promise<{ records: number, data: any[] }> => {
  try {
    // ตรวจสอบว่าไฟล์มีอยู่จริง
    if (!fs.existsSync(filePath)) {
      throw new Error('ไฟล์ไม่พบ');
    }
    
    // ประมวลผลตามนามสกุลไฟล์
    if (fileExt === '.csv') {
      return await processCsvFile(filePath);
    } else if (fileExt === '.xlsx' || fileExt === '.xls') {
      return await processExcelFile(filePath);
    } else {
      throw new Error('รูปแบบไฟล์ไม่รองรับ ต้องเป็น .csv, .xlsx หรือ .xls เท่านั้น');
    }
  } catch (error: any) {
    console.error('Error processing file:', error);
    throw new Error(`ไม่สามารถประมวลผลไฟล์ได้: ${error.message}`);
  }
};