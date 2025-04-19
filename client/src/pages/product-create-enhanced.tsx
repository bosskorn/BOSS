import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

interface Category {
  id: number;
  name: string;
}

interface Product {
  sku: string;
  name: string;
  category_id: number | '';
  description: string;
  price: number | '';
  cost: number | '';
  stock: number | '';
  weight: number | '';
  image: File | null;
  status: 'active' | 'inactive';
  tags: string[];
  dimensions: {
    width: number | '';
    height: number | '';
    length: number | '';
  };
}

interface ValidationErrors {
  sku?: string;
  name?: string;
  price?: string;
  image?: string;
}

interface StepProps {
  title: string;
  subtitle: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

// คอมโพเนนต์สำหรับแสดงขั้นตอน
const Step: React.FC<StepProps> = ({ title, subtitle, icon, completed, active }) => (
  <div className={`flex items-center ${active ? 'text-indigo-600' : completed ? 'text-green-600' : 'text-gray-400'}`}>
    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center 
      ${active ? 'bg-indigo-100 text-indigo-600' : 
        completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
      {completed ? (
        <i className="fa-solid fa-check"></i>
      ) : (
        <i className={`fa-solid ${icon}`}></i>
      )}
    </div>
    <div className="ml-3">
      <p className={`text-sm font-medium ${active ? 'text-indigo-600' : completed ? 'text-green-600' : 'text-gray-500'}`}>{title}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  </div>
);

// Tag Input Component
const TagInput: React.FC<{
  tags: string[];
  setTags: (tags: string[]) => void;
}> = ({ tags, setTags }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-x-auto py-2 px-3">
        <div className="flex flex-wrap gap-2 mr-2">
          {tags.map((tag, index) => (
            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {tag}
              <button 
                type="button" 
                onClick={() => removeTag(tag)} 
                className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600"
              >
                <i className="fa-solid fa-times text-xs"></i>
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 focus:outline-none text-sm"
          placeholder={tags.length === 0 ? "พิมพ์แท็กแล้วกด Enter..." : ""}
        />
      </div>
      <p className="text-xs text-gray-500">
        พิมพ์แท็กแล้วกด Enter เพื่อเพิ่ม (เช่น สินค้าขายดี, สินค้าใหม่, โปรโมชั่น)
      </p>
    </div>
  );
};

const ProductCreate: React.FC = () => {
  const [location] = useLocation();
  // ดึงค่า ID จาก URL parameter
  const params = new URLSearchParams(location.split('?')[1]);
  const productId = params.get('id');
  
  // สถานะสำหรับขั้นตอนการสร้างสินค้า
  const [activeStep, setActiveStep] = useState(1);
  const [stepsCompleted, setStepsCompleted] = useState<{[key: number]: boolean}>({
    1: false, 
    2: false, 
    3: false
  });
  
  // สถานะสำหรับแสดงคำแนะนำการใช้งาน
  const [showGuide, setShowGuide] = useState(false);

  // สถานะสำหรับสินค้าตัวอย่าง
  const [showTemplates, setShowTemplates] = useState(false);
  
  // สถานะสำหรับฟอร์มสร้างสินค้า
  const [product, setProduct] = useState<Product>({
    sku: '',
    name: '',
    category_id: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    weight: '',
    image: null,
    status: 'active',
    tags: [],
    dimensions: {
      width: '',
      height: '',
      length: ''
    }
  });
  
  // สถานะสำหรับโหมดการแก้ไข
  const [isEditMode, setIsEditMode] = useState(false);

  // สถานะอื่นๆ
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Ref สำหรับ file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // โหลดข้อมูลหมวดหมู่และข้อมูลสินค้าเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    fetchCategories();
    
    // ถ้ามี ID สินค้า ให้โหลดข้อมูลสินค้า
    if (productId) {
      fetchProductDetails(parseInt(productId));
      setIsEditMode(true);
    }
  }, [productId]);
  
  // ฟังก์ชันสำหรับดึงข้อมูลสินค้าที่ต้องการแก้ไข
  const fetchProductDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      if (responseData.success && responseData.data) {
        const productData = responseData.data;
        
        // แปลงข้อมูลเป็นรูปแบบที่ฟอร์มใช้งานได้
        setProduct({
          sku: productData.sku || '',
          name: productData.name || '',
          category_id: productData.categoryId || '',
          description: productData.description || '',
          price: productData.price ? parseFloat(productData.price) : '',
          cost: productData.cost ? parseFloat(productData.cost) : '',
          stock: productData.stock || '',
          weight: productData.weight ? parseFloat(productData.weight) : '',
          image: null,
          status: productData.status || 'active',
          tags: productData.tags || [],
          dimensions: {
            width: productData.dimensions?.width || '',
            height: productData.dimensions?.height || '',
            length: productData.dimensions?.length || ''
          }
        });
        
        // ถ้ามีรูปภาพ ให้แสดง preview
        if (productData.imageUrl) {
          setImagePreview(productData.imageUrl);
        }
        
        // ตั้งค่าขั้นตอนว่าทำสำเร็จแล้ว
        setStepsCompleted({ 1: true, 2: true, 3: false });
        setActiveStep(3);
        
        toast({
          title: 'โหลดข้อมูลสำเร็จ',
          description: 'ข้อมูลสินค้าพร้อมสำหรับการแก้ไขแล้ว',
          variant: 'default',
        });
      } else {
        throw new Error(responseData.message || 'ไม่สามารถโหลดข้อมูลสินค้าได้');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลสินค้าได้',
        variant: 'destructive',
      });
    }
  };

  // ฟังก์ชันเรียกข้อมูลหมวดหมู่จาก API
  const fetchCategories = async () => {
    try {
      // เรียกข้อมูลจาก API จริง
      const response = await fetch('/api/categories', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      if (responseData.success) {
        const categoriesData = responseData.data || [];
        
        // แปลงข้อมูลเป็นรูปแบบที่ต้องการ
        const mappedCategories: Category[] = categoriesData.map((cat: any) => ({
          id: cat.id,
          name: cat.name
        }));
        
        setCategories(mappedCategories);
      } else {
        throw new Error(responseData.message || 'ไม่สามารถโหลดข้อมูลหมวดหมู่ได้');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลหมวดหมู่ได้',
        variant: 'destructive',
      });
    }
  };

  // จัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // จัดการกับข้อมูล dimensions แยกต่างหาก
    if (name.includes('dimensions.')) {
      const dimensionField = name.split('.')[1];
      setProduct(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionField]: value
        }
      }));
    } else {
      setProduct(prev => ({ ...prev, [name]: value }));
    }
  };

  // จัดการการอัปโหลดรูปภาพ
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // ตรวจสอบประเภทไฟล์
      if (!file.type.match('image.*')) {
        setValidationErrors(prev => ({
          ...prev,
          image: 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'
        }));
        return;
      }
      
      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors(prev => ({
          ...prev,
          image: 'ขนาดไฟล์ต้องไม่เกิน 5MB'
        }));
        return;
      }

      setProduct(prev => ({ ...prev, image: file }));
      setValidationErrors(prev => ({ ...prev, image: undefined }));
      
      // สร้าง preview รูปภาพ
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ตรวจสอบว่าขั้นตอนที่ 1 สามารถทำต่อได้หรือไม่
  const validateStep1 = async () => {
    const errors: ValidationErrors = {};

    if (!product.sku.trim()) {
      errors.sku = 'กรุณาระบุ SKU สินค้า';
    } else {
      // ตรวจสอบว่า SKU ซ้ำหรือไม่ (เฉพาะกรณีสร้างสินค้าใหม่)
      if (!isEditMode) {
        try {
          const res = await fetch('/api/products?checkSku=true&sku=' + encodeURIComponent(product.sku.trim()), {
            method: 'GET',
            credentials: 'include'
          });
          
          const data = await res.json();
          if (data.exists) {
            errors.sku = 'SKU นี้ถูกใช้งานแล้ว กรุณาระบุ SKU อื่น';
          }
        } catch (error) {
          console.error('Error checking SKU:', error);
        }
      }
    }

    if (!product.name.trim()) {
      errors.name = 'กรุณาระบุชื่อสินค้า';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return false;
    }

    return true;
  };

  // ตรวจสอบว่าขั้นตอนที่ 2 สามารถทำต่อได้หรือไม่
  const validateStep2 = () => {
    const errors: ValidationErrors = {};

    if (!product.price) {
      errors.price = 'กรุณาระบุราคาขาย';
    } else if (Number(product.price) <= 0) {
      errors.price = 'ราคาขายต้องมากกว่า 0';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return false;
    }

    return true;
  };

  // ไปยังขั้นตอนถัดไป
  const goToNextStep = async () => {
    if (activeStep === 1) {
      const isValid = await validateStep1();
      if (isValid) {
        setStepsCompleted(prev => ({ ...prev, 1: true }));
        setActiveStep(2);
      }
    } else if (activeStep === 2 && validateStep2()) {
      setStepsCompleted(prev => ({ ...prev, 2: true }));
      setActiveStep(3);
    }
  };

  // ย้อนกลับไปขั้นตอนก่อนหน้า
  const goToPreviousStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  // ใช้สินค้าตัวอย่าง
  const useTemplate = (template: 'electronics' | 'clothing' | 'food') => {
    let templateProduct: Partial<Product> = {};
    
    if (template === 'electronics') {
      templateProduct = {
        name: 'หูฟังไร้สาย Bluetooth 5.0',
        sku: 'ELEC-001',
        category_id: 1,
        description: 'หูฟังไร้สายคุณภาพสูง รองรับ Bluetooth 5.0 ใช้งานได้ต่อเนื่อง 8 ชั่วโมง ระยะการเชื่อมต่อไกลถึง 10 เมตร เสียงคมชัด น้ำหนักเบา',
        price: 1590,
        cost: 790,
        stock: 50,
        weight: 0.25,
        status: 'active',
        tags: ['อิเล็กทรอนิกส์', 'สินค้าขายดี', 'แกดเจ็ต'],
        dimensions: {
          width: 10,
          height: 5,
          length: 10
        }
      };
    } else if (template === 'clothing') {
      templateProduct = {
        name: 'เสื้อยืดคอกลม Cotton 100%',
        sku: 'CLOTH-001',
        category_id: 2,
        description: 'เสื้อยืดคอกลมผลิตจากผ้าฝ้าย 100% นุ่มสบาย ระบายอากาศดี สีไม่ตก มีให้เลือกหลายไซส์',
        price: 290,
        cost: 150,
        stock: 100,
        weight: 0.3,
        status: 'active',
        tags: ['เสื้อผ้า', 'แฟชั่น', 'ลดราคา'],
        dimensions: {
          width: 30,
          height: 5,
          length: 40
        }
      };
    } else if (template === 'food') {
      templateProduct = {
        name: 'ชาเขียวมัทฉะออร์แกนิค พรีเมียม',
        sku: 'FOOD-001',
        category_id: 3,
        description: 'ชาเขียวมัทฉะคุณภาพสูง ปลูกแบบออร์แกนิค นำเข้าจากญี่ปุ่น รสชาติเข้มข้น อุดมไปด้วยสารต้านอนุมูลอิสระ',
        price: 450,
        cost: 220,
        stock: 30,
        weight: 0.1,
        status: 'active',
        tags: ['อาหาร', 'ชา', 'ออร์แกนิค'],
        dimensions: {
          width: 8,
          height: 12,
          length: 8
        }
      };
    }
    
    setProduct(prev => ({ 
      ...prev, 
      ...templateProduct 
    }));
    
    setShowTemplates(false);
    setStepsCompleted(prev => ({ ...prev, 1: true }));
    setActiveStep(2);
  };

  // บันทึกข้อมูลสินค้า
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูล
    const errors: ValidationErrors = {};

    if (!product.sku.trim()) {
      errors.sku = 'กรุณาระบุ SKU สินค้า';
    }

    if (!product.name.trim()) {
      errors.name = 'กรุณาระบุชื่อสินค้า';
    }

    if (!product.price) {
      errors.price = 'กรุณาระบุราคาขาย';
    } else if (Number(product.price) <= 0) {
      errors.price = 'ราคาขายต้องมากกว่า 0';
    }
    
    // ตรวจสอบรูปภาพ (บังคับสำหรับสินค้าใหม่)
    if (!isEditMode && !product.image && !imagePreview) {
      errors.image = 'กรุณาอัปโหลดรูปภาพสินค้า';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // เตรียมข้อมูลสำหรับส่ง API
      console.log('Preparing product data for submission');

      // สร้างข้อมูลสำหรับส่ง API แบบ JSON (แปลงข้อมูลให้ตรงกับที่ API ต้องการ)
      const productData = {
        sku: product.sku,
        name: product.name,
        categoryId: product.category_id ? Number(product.category_id) : undefined, // ต้องเป็น number
        description: product.description,
        price: product.price ? String(product.price) : undefined, // ต้องเป็น string
        cost: product.cost ? String(product.cost) : undefined, // ต้องเป็น string
        stock: product.stock ? Number(product.stock) : undefined, // ต้องเป็น number
        weight: product.weight ? String(product.weight) : undefined, // ต้องเป็น string
        status: product.status,
        tags: product.tags,
        dimensions: product.dimensions
      };

      console.log('Sending product data:', productData);

      let response;
      
      // เลือกเส้นทาง API ตามโหมดการทำงาน (เพิ่มใหม่หรือแก้ไข)
      if (isEditMode && productId) {
        // แก้ไขสินค้า
        const res = await fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify(productData),
          credentials: 'include'
        });
        
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        
        response = { data: await res.json() };
      } else {
        // เพิ่มสินค้าใหม่
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify(productData),
          credentials: 'include'
        });
        
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        
        response = { data: await res.json() };
      }

      if (response.data && response.data.success) {
        // รีเซ็ตฟอร์ม
        setProduct({
          sku: '',
          name: '',
          category_id: '',
          description: '',
          price: '',
          cost: '',
          stock: '',
          weight: '',
          image: null,
          status: 'active',
          tags: [],
          dimensions: {
            width: '',
            height: '',
            length: ''
          }
        });
        setImagePreview(null);
        setActiveStep(1);
        setStepsCompleted({1: false, 2: false, 3: false});
        setIsEditMode(false);
        
        // แสดงการแจ้งเตือน
        toast({
          title: 'บันทึกสำเร็จ',
          description: isEditMode 
            ? 'แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว' 
            : 'สินค้าถูกบันทึกเข้าระบบเรียบร้อยแล้ว',
          variant: 'default',
        });
      } else {
        throw new Error(response.data?.message || 'ไม่สามารถบันทึกข้อมูลสินค้าได้');
      }
      
    } catch (error: any) {
      console.error('Error creating/updating product:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลสินค้าได้',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Step Indicator */}
      <div className="mb-8 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
        <div className="flex justify-between">
          <div 
            className={`flex-1 max-w-xs cursor-pointer ${activeStep !== 1 ? 'hover:bg-gray-50' : ''}`}
            onClick={() => activeStep !== 1 && setActiveStep(1)}
          >
            <Step 
              title="ข้อมูลทั่วไป" 
              subtitle="รายละเอียดพื้นฐานของสินค้า" 
              icon="fa-box" 
              completed={stepsCompleted[1]} 
              active={activeStep === 1} 
            />
          </div>
          <div className="w-10 flex items-center justify-center">
            <div className="h-0.5 w-full bg-gray-200"></div>
          </div>
          <div 
            className={`flex-1 max-w-xs cursor-pointer ${activeStep !== 2 && stepsCompleted[1] ? 'hover:bg-gray-50' : ''}`}
            onClick={() => stepsCompleted[1] && activeStep !== 2 && setActiveStep(2)}
          >
            <Step 
              title="ราคาและสต็อก" 
              subtitle="ราคาขาย ต้นทุน และการจัดสต็อก"
              icon="fa-tag" 
              completed={stepsCompleted[2]} 
              active={activeStep === 2} 
            />
          </div>
          <div className="w-10 flex items-center justify-center">
            <div className="h-0.5 w-full bg-gray-200"></div>
          </div>
          <div 
            className={`flex-1 max-w-xs cursor-pointer ${activeStep !== 3 && stepsCompleted[2] ? 'hover:bg-gray-50' : ''}`}
            onClick={() => stepsCompleted[2] && activeStep !== 3 && setActiveStep(3)}
          >
            <Step 
              title="รูปภาพและการจัดส่ง" 
              subtitle="รูปสินค้า ขนาด น้ำหนัก และข้อมูลเพิ่มเติม" 
              icon="fa-truck" 
              completed={stepsCompleted[3]} 
              active={activeStep === 3} 
            />
          </div>
        </div>
      </div>

      {/* แนะนำการใช้งานและเทมเพลต */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            <i className="fa-solid fa-circle-info mr-1"></i>
            {showGuide ? 'ซ่อนคำแนะนำ' : 'ดูคำแนะนำการใช้งาน'}
          </button>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            <i className="fa-solid fa-copy mr-1"></i>
            {showTemplates ? 'ซ่อนเทมเพลต' : 'ใช้เทมเพลตสินค้า'}
          </button>
        </div>
      </div>

      {/* คำแนะนำการใช้งาน */}
      {showGuide && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
            <i className="fa-solid fa-circle-info mr-2"></i>
            คำแนะนำในการสร้างสินค้าใหม่
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <b>ขั้นตอนที่ 1:</b> กรอกข้อมูลทั่วไปของสินค้า เช่น รหัสสินค้า (SKU) ชื่อสินค้า หมวดหมู่ และคำอธิบายสินค้า
            </p>
            <p>
              <b>ขั้นตอนที่ 2:</b> กำหนดราคาขาย ต้นทุน และจำนวนสินค้าในสต็อก
            </p>
            <p>
              <b>ขั้นตอนที่ 3:</b> อัปโหลดรูปภาพสินค้า กำหนดน้ำหนักและขนาดสำหรับการจัดส่ง เพิ่มแท็กสินค้า และตั้งค่าสถานะการใช้งาน
            </p>
            <p>
              <b>เคล็ดลับ:</b> คุณสามารถคลิกที่ "ใช้เทมเพลตสินค้า" เพื่อใช้ตัวอย่างสินค้าที่มีข้อมูลครบถ้วน ช่วยให้สร้างสินค้าได้เร็วขึ้น
            </p>
          </div>
        </div>
      )}

      {/* เทมเพลตสินค้า */}
      {showTemplates && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-200 bg-indigo-50">
              <h3 className="font-medium text-indigo-700">เทมเพลตสินค้าอิเล็กทรอนิกส์</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">เหมาะสำหรับสินค้าประเภทอุปกรณ์อิเล็กทรอนิกส์ แกดเจ็ต และอุปกรณ์เสริม</p>
              <button
                type="button"
                onClick={() => useTemplate('electronics')}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <i className="fa-solid fa-bolt mr-2"></i>
                ใช้เทมเพลตนี้
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-200 bg-pink-50">
              <h3 className="font-medium text-pink-700">เทมเพลตสินค้าเสื้อผ้า</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">เหมาะสำหรับสินค้าประเภทเสื้อผ้า เครื่องแต่งกาย และแฟชั่น</p>
              <button
                type="button"
                onClick={() => useTemplate('clothing')}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700"
              >
                <i className="fa-solid fa-shirt mr-2"></i>
                ใช้เทมเพลตนี้
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-200 bg-green-50">
              <h3 className="font-medium text-green-700">เทมเพลตสินค้าอาหาร</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">เหมาะสำหรับสินค้าประเภทอาหาร เครื่องดื่ม และผลิตภัณฑ์อาหารเสริม</p>
              <button
                type="button"
                onClick={() => useTemplate('food')}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <i className="fa-solid fa-utensils mr-2"></i>
                ใช้เทมเพลตนี้
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ขั้นตอนที่ 1: ข้อมูลทั่วไป */}
        {activeStep === 1 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-6 border-b pb-3">
              <h2 className="text-xl font-medium text-gray-800 flex items-center">
                <i className="fa-solid fa-box text-indigo-600 mr-2"></i>
                ข้อมูลทั่วไปของสินค้า
              </h2>
              <p className="text-sm text-gray-500 mt-1">กรอกข้อมูลพื้นฐานที่จำเป็นสำหรับสินค้าของคุณ</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="productSKU" className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสสินค้า (SKU) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fa-solid fa-barcode text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      id="productSKU"
                      name="sku"
                      value={product.sku}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.sku ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="เช่น PROD-001, ELEC-001"
                    />
                  </div>
                  {validationErrors.sku ? (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.sku}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">รหัสที่ใช้ในการค้นหาและระบุสินค้า</p>
                  )}
                </div>

                <div>
                  <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อสินค้า <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fa-solid fa-box-open text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      id="productName"
                      name="name"
                      value={product.name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="ชื่อที่แสดงให้ลูกค้าเห็น"
                    />
                  </div>
                  {validationErrors.name ? (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">ชื่อที่จะแสดงให้ลูกค้าเห็น</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่สินค้า
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-folder text-gray-400"></i>
                  </div>
                  <select
                    id="productCategory"
                    name="category_id"
                    value={product.category_id}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-none"
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-chevron-down text-gray-400"></i>
                  </div>
                </div>
                <div className="mt-1 flex items-center text-xs text-gray-500">
                  <p>
                    จัดกลุ่มสินค้าเพื่อการค้นหาที่ง่ายขึ้น
                    {categories.length === 0 && (
                      <span className="ml-1 text-indigo-600">
                        <Link href="/category-manage">คลิกที่นี่เพื่อเพิ่มหมวดหมู่ใหม่</Link>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียดสินค้า
                </label>
                <textarea
                  id="productDescription"
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="อธิบายรายละเอียดสินค้า คุณสมบัติ และข้อมูลสำคัญต่างๆ..."
                ></textarea>
                <p className="mt-1 text-xs text-gray-500">
                  อธิบายคุณสมบัติ ประโยชน์ และรายละเอียดของสินค้าอย่างครบถ้วน เพื่อช่วยให้ลูกค้าตัดสินใจซื้อได้ง่ายขึ้น
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ขั้นตอนที่ 2: ราคาและสต็อก */}
        {activeStep === 2 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-6 border-b pb-3">
              <h2 className="text-xl font-medium text-gray-800 flex items-center">
                <i className="fa-solid fa-tag text-indigo-600 mr-2"></i>
                ราคาและสต็อกสินค้า
              </h2>
              <p className="text-sm text-gray-500 mt-1">กำหนดราคาขาย ต้นทุน และจำนวนสินค้าในคลัง</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    ราคาขาย <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fa-solid fa-tags text-gray-400"></i>
                    </div>
                    <input
                      type="number"
                      id="productPrice"
                      name="price"
                      value={product.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.price ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">฿</span>
                    </div>
                  </div>
                  {validationErrors.price ? (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">ราคาที่จะขายให้ลูกค้า</p>
                  )}
                </div>

                <div>
                  <label htmlFor="productCost" className="block text-sm font-medium text-gray-700 mb-1">
                    ราคาต้นทุน
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fa-solid fa-money-bill text-gray-400"></i>
                    </div>
                    <input
                      type="number"
                      id="productCost"
                      name="cost"
                      value={product.cost}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">฿</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    ต้นทุนต่อหน่วย ใช้คำนวณกำไร (เป็นข้อมูลภายใน)
                  </p>
                </div>

                <div>
                  <label htmlFor="productStock" className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนสต็อก
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fa-solid fa-cubes text-gray-400"></i>
                    </div>
                    <input
                      type="number"
                      id="productStock"
                      name="stock"
                      value={product.stock}
                      onChange={handleChange}
                      min="0"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">ชิ้น</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    จำนวนสินค้าที่มีอยู่ในคลัง ระบบจะตัดสต็อกอัตโนมัติเมื่อมีการสั่งซื้อ
                  </p>
                </div>
              </div>

              {/* ข้อมูลเพิ่มเติมเกี่ยวกับราคา */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-700">ข้อมูลกำไรโดยประมาณ</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">กำไรต่อชิ้น</p>
                    <p className="text-lg font-medium text-gray-800">
                      {product.price && product.cost ? 
                        new Intl.NumberFormat('th-TH', {
                          style: 'currency',
                          currency: 'THB',
                          minimumFractionDigits: 2
                        }).format(Number(product.price) - Number(product.cost)) 
                        : '฿0.00'}
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">อัตรากำไร</p>
                    <p className="text-lg font-medium text-gray-800">
                      {product.price && product.cost && Number(product.cost) > 0 ? 
                        `${((Number(product.price) - Number(product.cost)) / Number(product.price) * 100).toFixed(2)}%` 
                        : '0.00%'}
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">มูลค่าสต็อกทั้งหมด</p>
                    <p className="text-lg font-medium text-gray-800">
                      {product.cost && product.stock ? 
                        new Intl.NumberFormat('th-TH', {
                          style: 'currency',
                          currency: 'THB',
                          minimumFractionDigits: 2
                        }).format(Number(product.cost) * Number(product.stock)) 
                        : '฿0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ขั้นตอนที่ 3: รูปภาพและการจัดส่ง */}
        {activeStep === 3 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-6 border-b pb-3">
              <h2 className="text-xl font-medium text-gray-800 flex items-center">
                <i className="fa-solid fa-truck text-indigo-600 mr-2"></i>
                รูปภาพและข้อมูลการจัดส่ง
              </h2>
              <p className="text-sm text-gray-500 mt-1">อัปโหลดรูปภาพ กำหนดน้ำหนัก ขนาด และรายละเอียดเพิ่มเติม</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รูปภาพสินค้า
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <div className="mb-3">
                          <img src={imagePreview} alt="ตัวอย่างรูปภาพ" className="max-h-48 max-w-full mx-auto" />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <i className="fa-solid fa-image text-gray-400 text-4xl mb-3"></i>
                        </div>
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="productImage"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                        >
                          <span>อัปโหลดรูปภาพ</span>
                          <input
                            id="productImage"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">หรือลากและวางที่นี่</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF ขนาดไม่เกิน 5MB
                      </p>
                    </div>
                  </div>
                  {validationErrors.image && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.image}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    แท็กสินค้า
                  </label>
                  <TagInput 
                    tags={product.tags}
                    setTags={(newTags) => setProduct({...product, tags: newTags})}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="productWeight" className="block text-sm font-medium text-gray-700 mb-1">
                  น้ำหนักสินค้า (สำหรับการจัดส่ง)
                </label>
                <div className="relative mt-1 rounded-md shadow-sm w-full md:w-1/3">
                  <input
                    type="number"
                    name="weight"
                    id="productWeight"
                    value={product.weight}
                    onChange={handleChange}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">กก.</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  น้ำหนักสินค้ารวมบรรจุภัณฑ์ ใช้สำหรับคำนวณค่าจัดส่ง
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ขนาดสินค้า (กว้าง x ยาว x สูง)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative">
                    <input
                      type="number"
                      name="dimensions.width"
                      value={product.dimensions.width}
                      onChange={handleChange}
                      className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="กว้าง"
                      min="0"
                      step="0.1"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">ซม.</span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      name="dimensions.length"
                      value={product.dimensions.length}
                      onChange={handleChange}
                      className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="ยาว"
                      min="0"
                      step="0.1"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">ซม.</span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      name="dimensions.height"
                      value={product.dimensions.height}
                      onChange={handleChange}
                      className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="สูง"
                      min="0"
                      step="0.1"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">ซม.</span>
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  ระบุขนาดสินค้าเพื่อใช้คำนวณบรรจุภัณฑ์และค่าจัดส่ง
                </p>
              </div>

              <div>
                <label htmlFor="productStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  สถานะสินค้า
                </label>
                <div className="mt-1 relative">
                  <select
                    id="productStatus"
                    name="status"
                    value={product.status}
                    onChange={handleChange}
                    className="appearance-none block w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="active">ใช้งาน (Active)</option>
                    <option value="inactive">ไม่ใช้งาน (Inactive)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 md:right-auto md:left-[calc(33.333%-20px)] flex items-center px-2 text-gray-700">
                    <i className="fa-solid fa-chevron-down text-gray-400"></i>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  สินค้าที่ไม่ใช้งานจะไม่แสดงในร้านค้า
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ปุ่มนำทาง */}
        <div className="flex justify-between">
          <div>
            {activeStep > 1 && (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                ย้อนกลับ
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Link href="/product-list">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <i className="fa-solid fa-xmark mr-2"></i>
                ยกเลิก
              </button>
            </Link>
            
            {activeStep < 3 ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                ถัดไป
                <i className="fa-solid fa-arrow-right ml-2"></i>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-2"></i>
                    บันทึกสินค้า
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </Layout>
  );
};

export default ProductCreate;