import fs from 'fs';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import path from 'path';
import { storage } from '../storage';

// Process uploaded files based on type
export const processFile = async (filePath: string, fileExt: string): Promise<{ records: number, data: any[] }> => {
  try {
    let data: any[] = [];
    
    // Process based on file extension
    switch (fileExt) {
      case '.csv':
        data = await processCSV(filePath);
        break;
      case '.xls':
      case '.xlsx':
        data = await processExcel(filePath);
        break;
      default:
        throw new Error('ไม่รองรับประเภทไฟล์นี้');
    }

    // Determine data type and store in appropriate storage
    if (data.length > 0) {
      const sample = data[0];
      
      // Simple heuristic to guess data type
      if ('customer' in sample && 'total' in sample) {
        // Looks like order data
        await storeOrdersData(data);
      } else if ('name' in sample && 'price' in sample) {
        // Looks like product data
        await storeProductsData(data);
      } else if ('name' in sample && 'address' in sample) {
        // Looks like customer data
        await storeCustomersData(data);
      }
    }
    
    // Clean up the file after processing
    fs.unlinkSync(filePath);
    
    return {
      records: data.length,
      data: data.slice(0, 10) // Return only first 10 rows to avoid large response
    };
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

// Process CSV files
const processCSV = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Process Excel files
const processExcel = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};

// Store order data
const storeOrdersData = async (data: any[]): Promise<void> => {
  for (const item of data) {
    try {
      // Map CSV/Excel data to order structure
      const orderData = {
        customer: item.customer || 'Unknown',
        total: parseFloat(item.total) || 0,
        date: item.date || new Date().toISOString(),
        status: item.status || 'pending',
        items: item.items ? JSON.parse(item.items) : []
      };
      
      await storage.createOrder(orderData);
    } catch (error) {
      console.error('Error storing order data:', error);
      // Continue with next item rather than failing entire process
    }
  }
};

// Store product data
const storeProductsData = async (data: any[]): Promise<void> => {
  for (const item of data) {
    try {
      // Map CSV/Excel data to product structure
      const productData = {
        name: item.name || 'Unknown',
        price: parseFloat(item.price) || 0,
        description: item.description || '',
        stock: parseInt(item.stock) || 0,
        category: item.category || 'General'
      };
      
      await storage.createProduct(productData);
    } catch (error) {
      console.error('Error storing product data:', error);
    }
  }
};

// Store customer data
const storeCustomersData = async (data: any[]): Promise<void> => {
  for (const item of data) {
    try {
      // Map CSV/Excel data to customer structure
      const customerData = {
        name: item.name || 'Unknown',
        email: item.email || '',
        phone: item.phone || '',
        address: item.address || '',
        city: item.city || '',
        postalCode: item.postalCode || ''
      };
      
      await storage.createCustomer(customerData);
    } catch (error) {
      console.error('Error storing customer data:', error);
    }
  }
};
