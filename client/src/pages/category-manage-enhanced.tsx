import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import axios from 'axios';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

interface Category {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  productCount?: number;  // จำนวนสินค้าในหมวดหมู่นี้
  createdAt?: string;     // วันที่สร้าง
  updatedAt?: string;     // วันที่แก้ไขล่าสุด
  icon?: string;          // ไอคอนของหมวดหมู่ (ชื่อ class ของ Font Awesome)
}

interface ValidationErrors {
  name?: string;
  description?: string;
  icon?: string;
}

const CategoryManageEnhanced: React.FC = () => {
  // ข้อมูลผู้ใช้จาก Auth Context
  const { user } = useAuth();
  
  // สถานะสำหรับการแสดงผลและจัดการข้อมูล
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: number, name: string} | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editValidationErrors, setEditValidationErrors] = useState<ValidationErrors>({});
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'products-asc' | 'products-desc' | 'date-asc' | 'date-desc'>('name-asc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // สำหรับการแจ้งเตือน
  const [showHelpTips, setShowHelpTips] = useState(true);

  // สำหรับแก้ไขหมวดหมู่
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // สำหรับเพิ่มหมวดหมู่ใหม่
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<Category>({
    id: 0,
    name: '',
    description: '',
    isActive: true,
    icon: 'fa-box'
  });

  // สรุปข้อมูลหมวดหมู่
  const categoryStats = {
    total: categories.length,
    active: categories.filter(c => c.isActive).length,
    inactive: categories.filter(c => !c.isActive).length,
    withProducts: categories.filter(c => (c.productCount || 0) > 0).length
  };

  // ไอคอนที่สามารถเลือกได้
  const availableIcons = [
    { name: 'กล่อง', value: 'fa-box' },
    { name: 'ร้านค้า', value: 'fa-store' },
    { name: 'อาหาร', value: 'fa-utensils' },
    { name: 'เสื้อผ้า', value: 'fa-shirt' },
    { name: 'อิเล็กทรอนิกส์', value: 'fa-tv' },
    { name: 'ความงาม', value: 'fa-spray-can' },
    { name: 'สุขภาพ', value: 'fa-heart-pulse' },
    { name: 'กีฬา', value: 'fa-futbol' },
    { name: 'เครื่องเขียน', value: 'fa-pencil' },
    { name: 'ของเล่น', value: 'fa-gamepad' },
    { name: 'บ้าน', value: 'fa-house' },
    { name: 'รถยนต์', value: 'fa-car' },
    { name: 'หนังสือ', value: 'fa-book' },
    { name: 'เด็ก', value: 'fa-baby' },
    { name: 'อื่นๆ', value: 'fa-tag' },
  ];

  // โหลดข้อมูลหมวดหมู่เมื่อคอมโพเนนต์โหลดและมีข้อมูลผู้ใช้
  useEffect(() => {
    // ตรวจสอบว่ามีข้อมูลผู้ใช้แล้วหรือไม่
    if (user) {
      console.log('มีข้อมูลผู้ใช้แล้ว, ID:', user.id);
      fetchCategories();
    } else {
      console.warn('ยังไม่มีข้อมูลผู้ใช้');
    }
  }, [user]); // เพิ่ม user เป็น dependency ให้ useEffect

  // ฟังก์ชันเรียกข้อมูลหมวดหมู่จาก API
  const fetchCategories = async () => {
    try {
      console.log('เริ่มการดึงข้อมูลหมวดหมู่');
      
      // เรียกข้อมูลจาก API จริง พร้อมส่ง credentials
      const response = await axios.get('/api/categories', {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('ได้รับการตอบกลับจาก API:', response.data);
      
      // ตรวจสอบโครงสร้างข้อมูลที่ได้รับ
      let categoriesData = [];
      
      if (response.data.categories && Array.isArray(response.data.categories)) {
        console.log('พบข้อมูลในรูปแบบ response.data.categories');
        categoriesData = response.data.categories;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        console.log('พบข้อมูลในรูปแบบ response.data.data');
        categoriesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('พบข้อมูลในรูปแบบ response.data (array)');
        categoriesData = response.data;
      } else {
        console.warn('ไม่พบข้อมูลในรูปแบบที่คาดหวัง:', response.data);
        categoriesData = [];
      }
      
      console.log('ข้อมูลหมวดหมู่ที่ได้รับ:', categoriesData);
      
      // แปลงข้อมูลให้ตรงกับโครงสร้างที่ใช้
      const mappedCategories: Category[] = categoriesData.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || null,
        isActive: cat.isActive === undefined ? true : cat.isActive,
        productCount: 0, // จำนวนสินค้าต้องขอข้อมูลเพิ่มเติมแยกต่างหาก
        createdAt: cat.createdAt ? new Date(cat.createdAt).toISOString().split('T')[0] : undefined,
        updatedAt: cat.updatedAt ? new Date(cat.updatedAt).toISOString().split('T')[0] : undefined,
        icon: cat.icon || 'fa-box'
      }));
      
      console.log('ข้อมูลหมวดหมู่หลังจากแปลง:', mappedCategories);
      setCategories(mappedCategories);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      
      // ตรวจสอบการตอบกลับจาก API กรณีมีข้อผิดพลาด
      const errorMessage = error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลหมวดหมู่ได้';
      
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // กรองและเรียงลำดับหมวดหมู่
  const filteredAndSortedCategories = React.useMemo(() => {
    // กรองตามการค้นหา
    let result = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // กรองตามสถานะ
    if (filterStatus !== 'all') {
      result = result.filter(category => 
        filterStatus === 'active' ? category.isActive : !category.isActive
      );
    }

    // เรียงลำดับ
    switch (sortOrder) {
      case 'name-asc':
        return result.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return result.sort((a, b) => b.name.localeCompare(a.name));
      case 'products-asc':
        return result.sort((a, b) => (a.productCount || 0) - (b.productCount || 0));
      case 'products-desc':
        return result.sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
      case 'date-asc':
        return result.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      case 'date-desc':
        return result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      default:
        return result;
    }
  }, [categories, searchTerm, filterStatus, sortOrder]);

  // เปิด/ปิดฟอร์มเพิ่มหมวดหมู่
  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
    if (!isFormOpen) {
      // รีเซ็ตฟอร์มเมื่อเปิด
      setNewCategory({
        id: 0,
        name: '',
        description: '',
        isActive: true,
        icon: 'fa-box'
      });
      setValidationErrors({});
    }
  };

  // เปลี่ยนแปลงค่าในฟอร์มเพิ่มหมวดหมู่
  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'isActive') {
      setNewCategory(prev => ({ ...prev, isActive: value === 'true' }));
    } else {
      setNewCategory(prev => ({ ...prev, [name]: value }));
    }
  };

  // เปลี่ยนแปลงไอคอน
  const handleIconChange = (icon: string) => {
    setNewCategory(prev => ({ ...prev, icon }));
  };

  // เพิ่มหมวดหมู่ใหม่
  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูล
    const errors: ValidationErrors = {};
    if (!newCategory.name.trim()) {
      errors.name = 'กรุณาระบุชื่อหมวดหมู่';
    } else if (newCategory.name.trim().length < 2) {
      errors.name = 'ชื่อหมวดหมู่ต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // ส่งข้อมูลไปยัง API
      const response = await axios.post('/api/categories', {
        name: newCategory.name.trim(),
        description: newCategory.description?.trim() || null,
        isActive: newCategory.isActive,
        icon: newCategory.icon,
        parentId: null // ตั้งค่าเริ่มต้นให้เป็นหมวดหมู่หลัก
      });
      
      if (response.data && response.data.success) {
        // ดึงข้อมูลหมวดหมู่ใหม่จากการตอบกลับ
        const newCategoryData = response.data.data;
        
        // เพิ่มหมวดหมู่ใหม่เข้าไปในรายการ
        const updatedCategory: Category = {
          id: newCategoryData.id,
          name: newCategoryData.name,
          description: newCategoryData.description || null,
          isActive: newCategoryData.isActive === undefined ? true : newCategoryData.isActive,
          productCount: 0,
          createdAt: newCategoryData.createdAt ? new Date(newCategoryData.createdAt).toISOString().split('T')[0] : undefined,
          updatedAt: newCategoryData.updatedAt ? new Date(newCategoryData.updatedAt).toISOString().split('T')[0] : undefined,
          icon: newCategoryData.icon || 'fa-box'
        };
        
        setCategories([...categories, updatedCategory]);
        
        // รีเซ็ตฟอร์ม
        setNewCategory({
          id: 0,
          name: '',
          description: '',
          isActive: true,
          icon: 'fa-box'
        });
        
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
        
        setIsFormOpen(false);
        
        toast({
          title: 'เพิ่มหมวดหมู่สำเร็จ',
          description: `หมวดหมู่ "${updatedCategory.name}" ถูกเพิ่มเรียบร้อยแล้ว`,
          variant: 'default',
        });
      } else {
        throw new Error(response.data?.message || 'ไม่สามารถเพิ่มหมวดหมู่ได้');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มหมวดหมู่ได้',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // เปิดฟอร์มแก้ไขหมวดหมู่
  const startEditCategory = (category: Category) => {
    setEditingCategory({ ...category });
    setEditValidationErrors({});
  };

  // ยกเลิกการแก้ไข
  const cancelEdit = () => {
    setEditingCategory(null);
    setEditValidationErrors({});
  };

  // เปลี่ยนแปลงค่าในฟอร์มแก้ไขหมวดหมู่
  const handleEditCategoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingCategory) return;
    
    const { name, value } = e.target;
    
    if (name === 'isActive') {
      setEditingCategory(prev => prev ? { ...prev, isActive: value === 'true' } : null);
    } else {
      setEditingCategory(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  // เปลี่ยนแปลงไอคอนในโหมดแก้ไข
  const handleEditIconChange = (icon: string) => {
    if (!editingCategory) return;
    setEditingCategory({ ...editingCategory, icon });
  };

  // อัปเดตหมวดหมู่
  const updateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    // ตรวจสอบข้อมูล
    const errors: ValidationErrors = {};
    if (!editingCategory.name.trim()) {
      errors.name = 'กรุณาระบุชื่อหมวดหมู่';
    } else if (editingCategory.name.trim().length < 2) {
      errors.name = 'ชื่อหมวดหมู่ต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    if (Object.keys(errors).length > 0) {
      setEditValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // ส่งข้อมูลไปยัง API
      const response = await axios.put(`/api/categories/${editingCategory.id}`, {
        name: editingCategory.name.trim(),
        description: editingCategory.description?.trim() || null,
        isActive: editingCategory.isActive,
        icon: editingCategory.icon
      });
      
      if (response.data && response.data.success) {
        // ดึงข้อมูลจากการตอบกลับ
        const updatedCategoryData = response.data.data;
        
        // อัปเดตข้อมูลในสถานะ
        const updatedCategories = categories.map(category => 
          category.id === editingCategory.id 
            ? { 
                ...category,
                name: updatedCategoryData.name,
                description: updatedCategoryData.description || null,
                isActive: updatedCategoryData.isActive === undefined ? true : updatedCategoryData.isActive,
                icon: updatedCategoryData.icon || category.icon,
                updatedAt: updatedCategoryData.updatedAt ? new Date(updatedCategoryData.updatedAt).toISOString().split('T')[0] : category.updatedAt
              } 
            : category
        );
        
        setCategories(updatedCategories);
        setEditingCategory(null);
        
        toast({
          title: 'แก้ไขหมวดหมู่สำเร็จ',
          description: `หมวดหมู่ "${updatedCategoryData.name}" ถูกแก้ไขเรียบร้อยแล้ว`,
          variant: 'default',
        });
      } else {
        throw new Error(response.data?.message || 'ไม่สามารถแก้ไขหมวดหมู่ได้');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถแก้ไขหมวดหมู่ได้',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // เปิด popup ยืนยันการลบ
  const confirmDeleteCategory = (id: number, name: string) => {
    setCategoryToDelete({ id, name });
    setShowDeleteConfirm(true);
  };

  // ยกเลิกการลบ
  const cancelDelete = () => {
    setCategoryToDelete(null);
    setShowDeleteConfirm(false);
  };

  // ลบหมวดหมู่
  const confirmDelete = async () => {
    if (categoryToDelete === null) return;

    try {
      // ส่งคำสั่งลบไปยัง API
      const response = await axios.delete(`/api/categories/${categoryToDelete.id}`);
      
      if (response.data && response.data.success) {
        // ลบข้อมูลออกจากสถานะ
        const updatedCategories = categories.filter(category => category.id !== categoryToDelete.id);
        setCategories(updatedCategories);
        
        toast({
          title: 'ลบหมวดหมู่สำเร็จ',
          description: `หมวดหมู่ "${categoryToDelete.name}" ถูกลบออกจากระบบเรียบร้อยแล้ว`,
          variant: 'default',
        });
      } else {
        throw new Error(response.data?.message || 'ไม่สามารถลบหมวดหมู่ได้');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบหมวดหมู่ได้',
        variant: 'destructive',
      });
    } finally {
      setCategoryToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Layout>
      {/* ส่วนหัวหน้า */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 md:text-3xl flex items-center">
            <i className="fa-solid fa-folder-tree text-indigo-600 mr-2"></i>
            เพิ่ม/จัดการหมวดหมู่สินค้า
          </h1>
          <p className="mt-1 text-gray-600">
            จัดการหมวดหมู่สินค้า เพื่อให้การค้นหาและจัดกลุ่มสินค้าในระบบมีประสิทธิภาพมากขึ้น
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={toggleForm}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
          >
            <i className={`fa-solid ${isFormOpen ? 'fa-minus' : 'fa-plus'} mr-2`}></i>
            {isFormOpen ? 'ยกเลิก' : 'เพิ่มหมวดหมู่ใหม่'}
          </button>
        </div>
      </div>

      {/* สรุปข้อมูลหมวดหมู่ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">หมวดหมู่ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-800">{categoryStats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
              <i className="fa-solid fa-folder-open text-lg"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">หมวดหมู่ที่เปิดใช้งาน</p>
              <p className="text-2xl font-bold text-green-600">{categoryStats.active}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-full text-green-600">
              <i className="fa-solid fa-circle-check text-lg"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">หมวดหมู่ที่ปิดใช้งาน</p>
              <p className="text-2xl font-bold text-red-600">{categoryStats.inactive}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-full text-red-600">
              <i className="fa-solid fa-circle-xmark text-lg"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">หมวดหมู่ที่มีสินค้า</p>
              <p className="text-2xl font-bold text-purple-600">{categoryStats.withProducts}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full text-purple-600">
              <i className="fa-solid fa-cubes text-lg"></i>
            </div>
          </div>
        </div>
      </div>

      {/* คำแนะนำ */}
      {showHelpTips && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fa-solid fa-circle-info text-blue-600"></i>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">เคล็ดลับการจัดการหมวดหมู่</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>สร้างหมวดหมู่ที่มีความเฉพาะเจาะจงชัดเจน เพื่อให้ลูกค้าค้นหาสินค้าได้ง่าย</li>
                  <li>หลีกเลี่ยงการสร้างหมวดหมู่ที่ซ้ำซ้อนกัน</li>
                  <li>ระบุคำอธิบายที่ชัดเจนเพื่อให้เข้าใจขอบเขตของหมวดหมู่</li>
                  <li>หมวดหมู่ที่มีสินค้าอยู่แล้ว ควรระวังเรื่องการลบเพราะอาจส่งผลกระทบต่อสินค้า</li>
                </ul>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setShowHelpTips(false)}
                  className="inline-flex rounded-md p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">ปิด</span>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ฟอร์มเพิ่มหมวดหมู่ */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-400">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <i className="fa-solid fa-folder-plus mr-2"></i>
              เพิ่มหมวดหมู่ใหม่
            </h2>
          </div>
          
          <form onSubmit={addCategory} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="categoryName"
                  name="name"
                  value={newCategory.name}
                  onChange={handleNewCategoryChange}
                  required
                  className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="เช่น อุปกรณ์อิเล็กทรอนิกส์, อาหาร, แฟชั่น"
                />
                {validationErrors.name ? (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">ชื่อที่ใช้แสดงในรายการสินค้าและหน้าร้านค้า</p>
                )}
              </div>

              <div>
                <label htmlFor="categoryStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  สถานะการใช้งาน
                </label>
                <select
                  id="categoryStatus"
                  name="isActive"
                  value={newCategory.isActive.toString()}
                  onChange={handleNewCategoryChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="true">เปิดใช้งาน</option>
                  <option value="false">ปิดใช้งาน</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">หมวดหมู่ที่ปิดใช้งานจะไม่แสดงในหน้าร้านค้า</p>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียดหมวดหมู่
              </label>
              <textarea
                id="categoryDescription"
                name="description"
                value={newCategory.description || ''}
                onChange={handleNewCategoryChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับหมวดหมู่นี้..."
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">อธิบายว่าหมวดหมู่นี้ครอบคลุมสินค้าประเภทใดบ้าง</p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ไอคอนหมวดหมู่
              </label>
              <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
                {availableIcons.map((icon) => (
                  <div
                    key={icon.value}
                    className={`p-2 border rounded-md cursor-pointer text-center ${newCategory.icon === icon.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => handleIconChange(icon.value)}
                  >
                    <i className={`fa-solid ${icon.value} text-xl ${newCategory.icon === icon.value ? 'text-indigo-600' : 'text-gray-600'}`}></i>
                    <p className="text-xs mt-1 truncate">{icon.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={toggleForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-2"></i>
                    บันทึกหมวดหมู่
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ส่วนค้นหาและกรองข้อมูล */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
                ค้นหา
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  id="searchTerm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="ค้นหาตามชื่อหรือคำอธิบาย..."
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">
                สถานะ
              </label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">เปิดใช้งาน</option>
                <option value="inactive">ปิดใช้งาน</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                เรียงตาม
              </label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="name-asc">ชื่อ (ก-ฮ)</option>
                <option value="name-desc">ชื่อ (ฮ-ก)</option>
                <option value="products-asc">จำนวนสินค้า (น้อย-มาก)</option>
                <option value="products-desc">จำนวนสินค้า (มาก-น้อย)</option>
                <option value="date-asc">วันที่สร้าง (เก่า-ใหม่)</option>
                <option value="date-desc">วันที่สร้าง (ใหม่-เก่า)</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              แสดง {filteredAndSortedCategories.length} จาก {categories.length} รายการ
            </p>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md ${viewMode === 'card' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                title="มุมมองการ์ด"
              >
                <i className="fa-solid fa-table-cells-large"></i>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                title="มุมมองรายการ"
              >
                <i className="fa-solid fa-list"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* แสดงผลข้อมูลหมวดหมู่ */}
      {viewMode === 'card' ? (
        // มุมมองการ์ด
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedCategories.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-lg shadow-sm text-center border border-gray-200">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <i className="fa-solid fa-folder-open text-3xl"></i>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบหมวดหมู่</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'ไม่พบหมวดหมู่ที่ตรงกับคำค้นหา' : 'ยังไม่มีหมวดหมู่ในระบบ'}
              </p>
              <div className="mt-6">
                <button
                  onClick={toggleForm}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <i className="fa-solid fa-plus -ml-1 mr-2"></i>
                  เพิ่มหมวดหมู่ใหม่
                </button>
              </div>
            </div>
          ) : (
            filteredAndSortedCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-md flex items-center justify-center ${category.isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                      <i className={`fa-solid ${category.icon || 'fa-folder'} text-lg`}></i>
                    </div>
                    <h3 className="ml-3 text-sm font-medium truncate">{category.name}</h3>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {category.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">รายละเอียด</p>
                    <p className="text-sm text-gray-700 h-10 line-clamp-2">
                      {category.description || 'ไม่มีคำอธิบาย'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                    <div>
                      <p className="mb-1">จำนวนสินค้า</p>
                      <p className="font-semibold text-indigo-700">{category.productCount || 0} รายการ</p>
                    </div>
                    <div>
                      <p className="mb-1">สร้างเมื่อ</p>
                      <p className="font-semibold text-gray-700">{category.createdAt || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => startEditCategory(category)}
                      className="p-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100"
                    >
                      <i className="fa-solid fa-pen-to-square mr-1"></i>
                      แก้ไข
                    </button>
                    <button 
                      onClick={() => confirmDeleteCategory(category.id, category.name)}
                      className="p-2 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                      disabled={(category.productCount || 0) > 0}
                      title={(category.productCount || 0) > 0 ? 'ไม่สามารถลบหมวดหมู่ที่มีสินค้าได้' : ''}
                    >
                      <i className="fa-solid fa-trash-can mr-1"></i>
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // มุมมองตาราง
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อหมวดหมู่
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รายละเอียด
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จำนวนสินค้า
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สร้าง
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center">
                        <i className="fa-solid fa-folder-open text-gray-400 text-3xl mb-2"></i>
                        <p className="text-sm font-medium text-gray-900">ไม่พบหมวดหมู่</p>
                        <p className="text-sm text-gray-500">
                          {searchTerm ? 'ไม่พบหมวดหมู่ที่ตรงกับคำค้นหา' : 'ยังไม่มีหมวดหมู่ในระบบ'}
                        </p>
                        <button
                          onClick={toggleForm}
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <i className="fa-solid fa-plus -ml-1 mr-2"></i>
                          เพิ่มหมวดหมู่ใหม่
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-md flex items-center justify-center ${category.isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                            <i className={`fa-solid ${category.icon || 'fa-folder'} text-lg`}></i>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {category.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">{category.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">{category.productCount || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {category.createdAt || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {category.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => startEditCategory(category)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <i className="fa-solid fa-pen-to-square mr-1"></i> แก้ไข
                        </button>
                        <button 
                          onClick={() => confirmDeleteCategory(category.id, category.name)}
                          className="text-red-600 hover:text-red-900"
                          disabled={(category.productCount || 0) > 0}
                          title={(category.productCount || 0) > 0 ? 'ไม่สามารถลบหมวดหมู่ที่มีสินค้าได้' : ''}
                        >
                          <i className="fa-solid fa-trash-can mr-1"></i> ลบ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal แก้ไขหมวดหมู่ */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                  <i className="fa-solid fa-folder-pen mr-2 text-indigo-600"></i>
                  แก้ไขหมวดหมู่
                </h3>
                <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={updateCategory}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="editCategoryName" className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="editCategoryName"
                      name="name"
                      value={editingCategory.name}
                      onChange={handleEditCategoryChange}
                      className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${editValidationErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    {editValidationErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{editValidationErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="editCategoryStatus" className="block text-sm font-medium text-gray-700 mb-1">
                      สถานะการใช้งาน
                    </label>
                    <select
                      id="editCategoryStatus"
                      name="isActive"
                      value={editingCategory.isActive.toString()}
                      onChange={handleEditCategoryChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="true">เปิดใช้งาน</option>
                      <option value="false">ปิดใช้งาน</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="editCategoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    รายละเอียด
                  </label>
                  <textarea
                    id="editCategoryDescription"
                    name="description"
                    value={editingCategory.description || ''}
                    onChange={handleEditCategoryChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                  ></textarea>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ไอคอนหมวดหมู่
                  </label>
                  <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
                    {availableIcons.map((icon) => (
                      <div
                        key={icon.value}
                        className={`p-2 border rounded-md cursor-pointer text-center ${editingCategory.icon === icon.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => handleEditIconChange(icon.value)}
                      >
                        <i className={`fa-solid ${icon.value} text-xl ${editingCategory.icon === icon.value ? 'text-indigo-600' : 'text-gray-600'}`}></i>
                        <p className="text-xs mt-1 truncate">{icon.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i> กำลังบันทึก...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <i className="fa-solid fa-check mr-2"></i> บันทึก
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Popup ยืนยันการลบ */}
      {showDeleteConfirm && categoryToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-center align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <i className="fa-solid fa-exclamation-triangle text-xl"></i>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">ยืนยันการลบ</h3>
              <p className="text-sm text-gray-500 mb-6">
                คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ <strong>"{categoryToDelete.name}"</strong>? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CategoryManageEnhanced;