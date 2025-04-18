import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
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
  image: File | null;
  status: 'active' | 'inactive';
}

interface ValidationErrors {
  sku?: string;
  name?: string;
  price?: string;
  image?: string;
}

const ProductCreate: React.FC = () => {
  // สถานะสำหรับฟอร์มสร้างสินค้า
  const [product, setProduct] = useState<Product>({
    sku: '',
    name: '',
    category_id: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    image: null,
    status: 'active'
  });

  // สถานะอื่นๆ
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Ref สำหรับ file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // โหลดข้อมูลหมวดหมู่เมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    fetchCategories();
  }, []);

  // ฟังก์ชันเรียกข้อมูลหมวดหมู่จาก API
  const fetchCategories = async () => {
    try {
      // สำหรับการสาธิต ใช้ข้อมูลจำลอง
      // ในการใช้งานจริง ควรเปลี่ยนเป็น await axios.get('/api/categories')
      const mockCategories: Category[] = [
        { id: 1, name: 'อุปกรณ์อิเล็กทรอนิกส์' },
        { id: 2, name: 'เสื้อผ้าแฟชั่น' },
        { id: 3, name: 'อาหารและเครื่องดื่ม' }
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลหมวดหมู่ได้',
        variant: 'destructive',
      });
    }
  };

  // จัดการการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
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

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // จำลองการส่งข้อมูล
      console.log('Submitting product data:', {
        ...product,
        image: product.image ? product.image.name : null,
      });

      // สร้าง FormData สำหรับส่งไฟล์
      const formData = new FormData();
      Object.entries(product).forEach(([key, value]) => {
        if (key === 'image' && value) {
          formData.append(key, value);
        } else if (value !== '') {
          formData.append(key, String(value));
        }
      });

      // สำหรับการสาธิต (ในการใช้งานจริงควรใช้ axios.post)
      setTimeout(() => {
        // รีเซ็ตฟอร์ม
        setProduct({
          sku: '',
          name: '',
          category_id: '',
          description: '',
          price: '',
          cost: '',
          stock: '',
          image: null,
          status: 'active'
        });
        setImagePreview(null);
        
        // แสดงการแจ้งเตือน
        toast({
          title: 'บันทึกสำเร็จ',
          description: 'สินค้าถูกบันทึกเข้าระบบเรียบร้อยแล้ว',
          variant: 'default',
        });
        
        setIsSubmitting(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกข้อมูลสินค้าได้',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* หัวข้อสร้างสินค้าใหม่ */}
        <div className="bg-white p-4 rounded-lg shadow flex items-center text-xl text-gray-800 font-semibold">
          <i className="fa-solid fa-plus-circle text-green-600 mr-2"></i> สร้างสินค้าใหม่
        </div>

        {/* ส่วนข้อมูลทั่วไป */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4 pb-2 border-b flex items-center">
            <i className="fa-solid fa-info-circle text-blue-600 mr-2"></i>
            <h2 className="text-lg font-medium text-gray-700">ข้อมูลทั่วไป</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="productSKU" className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="productSKU"
                name="sku"
                value={product.sku}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.sku ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="รหัสสินค้าที่ใช้งาน"
              />
              {validationErrors.sku && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.sku}</p>
              )}
            </div>

            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อสินค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="productName"
                name="name"
                value={product.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="ชื่อสินค้าที่แสดง"
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 mb-1">
                หมวดหมู่
              </label>
              <select
                id="productCategory"
                name="category_id"
                value={product.category_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  ยังไม่มีหมวดหมู่ในระบบ <Link href="/category-manage" className="text-indigo-600">คลิกที่นี่</Link> เพื่อเพิ่มหมวดหมู่
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-1">
              รายละเอียดสินค้า
            </label>
            <textarea
              id="productDescription"
              name="description"
              value={product.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="รายละเอียดสินค้าเพิ่มเติม"
            ></textarea>
          </div>
        </div>

        {/* ส่วนราคาและสต็อก */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4 pb-2 border-b flex items-center">
            <i className="fa-solid fa-dollar-sign text-green-600 mr-2"></i>
            <h2 className="text-lg font-medium text-gray-700">ราคาและสต็อก</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-1">
                ราคาขาย <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="productPrice"
                name="price"
                value={product.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.price ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0.00"
              />
              {validationErrors.price && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
              )}
            </div>

            <div>
              <label htmlFor="productCost" className="block text-sm font-medium text-gray-700 mb-1">
                ราคาต้นทุน/หน่วย
              </label>
              <input
                type="number"
                id="productCost"
                name="cost"
                value={product.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00 (ไม่บังคับ)"
              />
            </div>

            <div>
              <label htmlFor="productStock" className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนสต็อก
              </label>
              <input
                type="number"
                id="productStock"
                name="stock"
                value={product.stock}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* ส่วนรูปภาพสินค้า */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4 pb-2 border-b flex items-center">
            <i className="fa-solid fa-image text-purple-600 mr-2"></i>
            <h2 className="text-lg font-medium text-gray-700">รูปภาพสินค้า</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เลือกรูปภาพ
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="file"
                  id="productImage"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <i className="fa-solid fa-upload mr-2"></i>
                  กดเพื่อแนบรูปภาพ
                </button>
                <span className="ml-3 text-sm text-gray-500">
                  {product.image ? product.image.name : 'ยังไม่ได้เลือกไฟล์'}
                </span>
              </div>
              {validationErrors.image && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.image}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ตัวอย่างรูปภาพ
              </label>
              <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 flex justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="ตัวอย่างรูปภาพ" className="max-h-48 max-w-full" />
                ) : (
                  <div className="text-center text-gray-500">
                    <i className="fa-solid fa-image text-3xl mb-2"></i>
                    <p>ยังไม่มีรูปภาพ</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนสถานะสินค้า */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4 pb-2 border-b flex items-center">
            <i className="fa-solid fa-toggle-on text-blue-600 mr-2"></i>
            <h2 className="text-lg font-medium text-gray-700">สถานะสินค้า</h2>
          </div>

          <div>
            <label htmlFor="productStatus" className="block text-sm font-medium text-gray-700 mb-1">
              สถานะ
            </label>
            <select
              id="productStatus"
              name="status"
              value={product.status}
              onChange={handleChange}
              className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="active">ใช้งาน (Active)</option>
              <option value="inactive">ไม่ใช้งาน (Inactive)</option>
            </select>
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <div className="flex justify-end gap-3">
          <Link href="/product-list">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ยกเลิก
            </button>
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <i className="fa-solid fa-spinner fa-spin mr-2"></i> กำลังบันทึก...
              </span>
            ) : (
              <span className="flex items-center">
                <i className="fa-solid fa-save mr-2"></i> บันทึกสินค้า
              </span>
            )}
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default ProductCreate;