import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';

interface Category {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface ValidationErrors {
  name?: string;
}

const CategoryManage: React.FC = () => {
  // สถานะสำหรับการแสดงผลและจัดการข้อมูล
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editValidationErrors, setEditValidationErrors] = useState<ValidationErrors>({});

  // สำหรับแก้ไขหมวดหมู่
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // สำหรับเพิ่มหมวดหมู่ใหม่
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    isActive: true
  });

  // สำหรับเมนู dropdown
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        { id: 1, name: 'อุปกรณ์อิเล็กทรอนิกส์', description: 'อุปกรณ์ไอทีและอิเล็กทรอนิกส์ทั้งหมด', isActive: true },
        { id: 2, name: 'เสื้อผ้าแฟชั่น', description: 'เสื้อผ้าและเครื่องแต่งกาย', isActive: true },
        { id: 3, name: 'อาหารและเครื่องดื่ม', description: 'ผลิตภัณฑ์อาหารทุกประเภท', isActive: false }
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showNotification('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลหมวดหมู่ได้', 'error');
    }
  };

  // กรองหมวดหมู่ตามการค้นหา
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // แสดงแจ้งเตือน popup
  const showNotification = (title: string, message: string, type: 'success' | 'error') => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  // ปิด popup
  const closePopup = () => {
    setShowPopup(false);
  };

  // เพิ่มหมวดหมู่ใหม่
  const addCategory = async () => {
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
      // จำลองการเพิ่มข้อมูล (ในการใช้งานจริงควรใช้ axios.post)
      const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
      const newCategoryData: Category = {
        id: newId,
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || null,
        isActive: newCategory.isActive
      };
      
      // เพิ่มหมวดหมู่ใหม่เข้าไปในรายการ
      setCategories([...categories, newCategoryData]);
      
      // รีเซ็ตฟอร์ม
      setNewCategory({
        name: '',
        description: '',
        isActive: true
      });
      
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      toast({
        title: 'เพิ่มหมวดหมู่สำเร็จ',
        description: `หมวดหมู่ "${newCategoryData.name}" ถูกเพิ่มเรียบร้อยแล้ว`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error adding category:', error);
      showNotification('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มหมวดหมู่ได้', 'error');
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

  // อัปเดตหมวดหมู่
  const updateCategory = async () => {
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
      // จำลองการอัปเดตข้อมูล (ในการใช้งานจริงควรใช้ axios.put)
      const updatedCategories = categories.map(category => 
        category.id === editingCategory.id 
          ? { 
              ...editingCategory, 
              name: editingCategory.name.trim(),
              description: editingCategory.description?.trim() || null
            } 
          : category
      );
      
      setCategories(updatedCategories);
      setEditingCategory(null);
      
      toast({
        title: 'แก้ไขหมวดหมู่สำเร็จ',
        description: `หมวดหมู่ "${editingCategory.name}" ถูกแก้ไขเรียบร้อยแล้ว`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating category:', error);
      showNotification('เกิดข้อผิดพลาด', 'ไม่สามารถแก้ไขหมวดหมู่ได้', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // เปิด popup ยืนยันการลบ
  const confirmDeleteCategory = (id: number) => {
    setCategoryToDelete(id);
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
      // จำลองการลบข้อมูล (ในการใช้งานจริงควรใช้ axios.delete)
      const updatedCategories = categories.filter(category => category.id !== categoryToDelete);
      setCategories(updatedCategories);
      
      toast({
        title: 'ลบหมวดหมู่สำเร็จ',
        description: 'หมวดหมู่ถูกลบออกจากระบบเรียบร้อยแล้ว',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      showNotification('เกิดข้อผิดพลาด', 'ไม่สามารถลบหมวดหมู่ได้', 'error');
    } finally {
      setCategoryToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  // สลับการแสดงผล dropdown
  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  // สลับการแสดงผล sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-kanit">
      {/* ส่วนหัวและเมนู */}
      <header className="bg-white shadow-md">
        <div className="container px-4 py-3 mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-truck-fast text-green-600 text-xl"></i>
            <h1 className="text-xl font-semibold">ระบบจัดการขนส่ง</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => toggleDropdown('products')}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
            >
              <i className="fa-solid fa-boxes-stacked"></i>
              <span>สินค้า</span>
              <i className={`fa-solid fa-caret-down ml-1 transition-transform ${activeDropdown === 'products' ? 'rotate-180' : ''}`}></i>
            </button>
            <button 
              onClick={toggleSidebar}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
            >
              <i className="fa-solid fa-user"></i>
              <span>บัญชี</span>
            </button>
          </div>
        </div>
        
        {/* Dropdown เมนูสินค้า */}
        {activeDropdown === 'products' && (
          <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md border border-gray-200 right-10 w-48">
            <div className="py-1">
              <Link href="/product-list" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <i className="fa-solid fa-tags mr-2"></i>สินค้าทั้งหมด
              </Link>
              <Link href="/product-create" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <i className="fa-solid fa-plus-square mr-2"></i>สร้างสินค้า
              </Link>
              <Link href="/category-manage" className="block px-4 py-2 text-sm text-gray-700 bg-gray-100">
                <i className="fa-solid fa-folder-plus mr-2"></i>เพิ่มหมวดหมู่สินค้า
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleSidebar}></div>
          <div className="relative flex flex-col w-72 max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-medium">บัญชีผู้ใช้</h2>
              <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-gray-200">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="flex flex-col p-4 border-b">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div>
                  <p className="font-medium">ผู้ใช้ทดสอบระบบ</p>
                  <p className="text-sm text-gray-500">ผู้ดูแลระบบ</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <span className="text-sm flex items-center">
                  <i className="fa-solid fa-wallet mr-2 text-green-600"></i> ยอดเงินคงเหลือ:
                </span>
                <span className="font-semibold">0.00 บาท</span>
              </div>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-1">
                <li>
                  <a href="/profile" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                    <i className="fa-solid fa-user-gear w-5 mr-2"></i> ข้อมูลผู้ใช้
                  </a>
                </li>
                <li>
                  <a href="/topup" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                    <i className="fa-solid fa-credit-card w-5 mr-2"></i> เติมเครดิต
                  </a>
                </li>
                <li>
                  <a href="/login" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                    <i className="fa-solid fa-right-from-bracket w-5 mr-2"></i> ออกจากระบบ
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* เนื้อหาหลัก */}
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
            เพิ่ม/จัดการหมวดหมู่สินค้า
          </h1>
          <p className="mt-2 text-gray-600">
            จัดการหมวดหมู่สินค้า เพื่อให้การค้นหาและจัดกลุ่มสินค้าในระบบมีประสิทธิภาพมากขึ้น
          </p>
        </div>

        {/* ส่วนเพิ่มหมวดหมู่ใหม่ */}
        <div className="p-6 mb-8 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-700">เพิ่มหมวดหมู่ใหม่</h2>
          <form onSubmit={(e) => { e.preventDefault(); addCategory(); }} className="space-y-4">
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
                ชื่อหมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="categoryName"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                required
                className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="เช่น อุปกรณ์อิเล็กทรอนิกส์, อาหาร, แฟชั่น"
              />
              {validationErrors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700">
                รายละเอียดหมวดหมู่ (ไม่บังคับ)
              </label>
              <textarea
                id="categoryDescription"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับหมวดหมู่นี้..."
              ></textarea>
            </div>

            <div>
              <label htmlFor="categoryStatus" className="block text-sm font-medium text-gray-700">
                สถานะการใช้งาน
              </label>
              <select
                id="categoryStatus"
                value={newCategory.isActive.toString()}
                onChange={(e) => setNewCategory({...newCategory, isActive: e.target.value === 'true'})}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="true">เปิดใช้งาน</option>
                <option value="false">ปิดใช้งาน</option>
              </select>
            </div>

            <div className="flex items-center justify-end pt-2">
              {showSuccessMessage && (
                <p className="mr-4 text-sm text-green-600">
                  เพิ่มหมวดหมู่เรียบร้อยแล้ว!
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'กำลังเพิ่ม...' : 'เพิ่มหมวดหมู่'}
              </button>
            </div>
          </form>
        </div>

        {/* ส่วนแสดงรายการหมวดหมู่ */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-700">รายการหมวดหมู่ทั้งหมด</h2>

          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาตามชื่อหมวดหมู่..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 md:w-1/3"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ชื่อหมวดหมู่</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">รายละเอียด</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">สถานะ</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm text-center text-gray-500 whitespace-nowrap">
                      ไม่พบหมวดหมู่ที่ตรงกับการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{category.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{category.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {category.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <button 
                          onClick={() => startEditCategory(category)} 
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                        >
                          <i className="fa-solid fa-pen-to-square mr-1"></i>
                          แก้ไข
                        </button>
                        <button 
                          onClick={() => confirmDeleteCategory(category.id)} 
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <i className="fa-solid fa-trash-can mr-1"></i>
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal แก้ไขหมวดหมู่ */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">แก้ไขหมวดหมู่</h3>
                <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); updateCategory(); }}>
                <div className="mb-4">
                  <label htmlFor="editCategoryName" className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="editCategoryName"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${editValidationErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                  {editValidationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{editValidationErrors.name}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="editCategoryDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    รายละเอียด
                  </label>
                  <textarea
                    id="editCategoryDescription"
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editCategoryStatus"
                      checked={editingCategory.isActive}
                      onChange={(e) => setEditingCategory({...editingCategory, isActive: e.target.checked})}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="editCategoryStatus" className="ml-2 block text-sm text-gray-900">
                      เปิดใช้งาน
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Popup ยืนยันการลบ */}
      {showDeleteConfirm && (
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
                คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
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

      {/* Popup แจ้งเตือน */}
      {showPopup && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className={`px-4 py-5 sm:p-6 ${popupType === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${popupType === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {popupType === 'success' ? (
                      <i className="fa-solid fa-check text-green-600"></i>
                    ) : (
                      <i className="fa-solid fa-times text-red-600"></i>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {popupTitle}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {popupMessage}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={closePopup}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${popupType === 'success' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}
                  >
                    ตกลง
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManage;