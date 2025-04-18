import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  category_id?: number;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  imageUrl?: string;
  description?: string;
}

const ProductList: React.FC = () => {
  // สถานะสำหรับรายการสินค้า
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // สถานะสำหรับการค้นหาและกรอง
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // สถานะสำหรับการแก้ไขสินค้า
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // สถานะสำหรับการลบสินค้า
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{id: number, name: string} | null>(null);
  
  // สำหรับ dropdown และ sidebar
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // โหลดข้อมูลสินค้าเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    loadProducts();
  }, []);

  // ฟังก์ชันโหลดข้อมูลสินค้า
  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // ดึงข้อมูลจริงจากฐานข้อมูล
      const response = await axios.get('/api/products');
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'ไม่สามารถโหลดข้อมูลสินค้าได้');
      }
      
      // แปลงข้อมูลที่ได้จาก API ให้อยู่ในรูปแบบที่ต้องการแสดงผล
      const products = response.data.data.map((product: any) => {
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category?.name || 'ไม่มีหมวดหมู่',
          category_id: product.categoryId,
          price: parseFloat(product.price || 0),
          stock: product.stock || 0,
          status: product.status || 'active',
          imageUrl: product.imageUrl,
          description: product.description || ''
        };
      });
      
      // กรองข้อมูลตามเงื่อนไขการค้นหา
      let filteredProducts = [...products];
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchLower) || 
          product.sku.toLowerCase().includes(searchLower)
        );
      }
      
      if (selectedCategory) {
        filteredProducts = filteredProducts.filter(product => 
          product.category === selectedCategory
        );
      }
      
      if (selectedStatus) {
        filteredProducts = filteredProducts.filter(product => 
          product.status === selectedStatus
        );
      }
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('ไม่สามารถโหลดข้อมูลสินค้าได้');
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลสินค้าได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันค้นหาและกรองสินค้า
  const applyFilters = () => {
    loadProducts();
  };

  // ฟังก์ชันเปิดโมดัลแก้ไขสินค้า
  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  // ฟังก์ชันปิดโมดัลแก้ไขสินค้า
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
  };

  // ฟังก์ชันบันทึกการแก้ไขสินค้า
  const submitEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsUpdating(true);

    try {
      // จำลองการส่งข้อมูล (ในการใช้งานจริงควรใช้ axios.put)
      console.log('Submitting edited product:', editingProduct);

      // จำลองการอัปเดตข้อมูลในรายการสินค้า
      const updatedProducts = products.map(product => 
        product.id === editingProduct.id ? editingProduct : product
      );
      
      setProducts(updatedProducts);
      setShowEditModal(false);
      
      toast({
        title: 'บันทึกสำเร็จ',
        description: `อัปเดตสินค้า "${editingProduct.name}" เรียบร้อยแล้ว`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตข้อมูลสินค้าได้',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // ฟังก์ชันเปิดโมดัลยืนยันการลบสินค้า
  const confirmDeleteProduct = (id: number, name: string) => {
    setProductToDelete({ id, name });
    setShowDeleteConfirm(true);
  };

  // ฟังก์ชันยกเลิกการลบสินค้า
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  // ฟังก์ชันลบสินค้า
  const deleteProduct = async () => {
    if (!productToDelete) return;

    try {
      // จำลองการส่งข้อมูล (ในการใช้งานจริงควรใช้ axios.delete)
      console.log('Deleting product:', productToDelete);

      // จำลองการลบข้อมูลจากรายการสินค้า
      const updatedProducts = products.filter(product => product.id !== productToDelete.id);
      
      setProducts(updatedProducts);
      setShowDeleteConfirm(false);
      
      toast({
        title: 'ลบสำเร็จ',
        description: `ลบสินค้า "${productToDelete.name}" เรียบร้อยแล้ว`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบข้อมูลสินค้าได้',
        variant: 'destructive',
      });
    } finally {
      setProductToDelete(null);
    }
  };

  // ฟังก์ชันสลับการแสดงผล dropdown
  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  // ฟังก์ชันสลับการแสดงผล sidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // ฟังก์ชันฟอร์แมตตัวเลขเป็นรูปแบบเงิน
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // ฟังก์ชันฟอร์แมตตัวเลข
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  // ฟังก์ชันแปลงสถานะเป็นข้อความภาษาไทย
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'ใช้งาน';
      case 'inactive':
        return 'ไม่ใช้งาน';
      default:
        return status;
    }
  };

  // ฟังก์ชันกำหนด class สำหรับแสดงสถานะ
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'inline-flex px-2 text-xs font-semibold leading-5 rounded-full bg-green-100 text-green-800';
      case 'inactive':
        return 'inline-flex px-2 text-xs font-semibold leading-5 rounded-full bg-red-100 text-red-800';
      default:
        return 'inline-flex px-2 text-xs font-semibold leading-5 rounded-full bg-gray-100 text-gray-800';
    }
  };

  // ฟังก์ชันดึง URL รูปภาพ
  const getImageUrl = (url: string | undefined) => {
    return url || 'https://via.placeholder.com/40';
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
              <Link href="/product-list" className="block px-4 py-2 text-sm text-gray-700 bg-gray-100">
                <i className="fa-solid fa-tags mr-2"></i>สินค้าทั้งหมด
              </Link>
              <Link href="/product-create" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <i className="fa-solid fa-plus-square mr-2"></i>สร้างสินค้า
              </Link>
              <Link href="/category-manage" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <i className="fa-solid fa-folder-plus mr-2"></i>เพิ่มหมวดหมู่สินค้า
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Sidebar */}
      {sidebarVisible && (
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
                  <a href="/auth" className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                    <i className="fa-solid fa-right-from-bracket w-5 mr-2"></i> ออกจากระบบ
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* เนื้อหาหลัก */}
      <main className="container mx-auto p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800 flex items-center">
              <i className="fa-solid fa-tags mr-2 text-indigo-600"></i> สินค้าทั้งหมด
            </h1>
          </div>

          <div className="p-6">
            {/* ส่วนค้นหาและกรอง */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-1">
                <label htmlFor="productSearch" className="block text-sm font-medium text-gray-700 mb-1">
                  ค้นหาสินค้า (ชื่อ หรือ SKU):
                </label>
                <input
                  type="text"
                  id="productSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="กรอกชื่อสินค้า หรือ SKU"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="productCategoryFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่:
                </label>
                <select
                  id="productCategoryFilter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="อุปกรณ์อิเล็กทรอนิกส์">อุปกรณ์อิเล็กทรอนิกส์</option>
                  <option value="เสื้อผ้าแฟชั่น">เสื้อผ้าแฟชั่น</option>
                  <option value="อาหารและเครื่องดื่ม">อาหารและเครื่องดื่ม</option>
                  <option value="ความงามและสุขภาพ">ความงามและสุขภาพ</option>
                </select>
              </div>

              <div>
                <label htmlFor="productStatusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  สถานะ:
                </label>
                <select
                  id="productStatusFilter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ไม่ใช้งาน</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-700 flex items-center">
                <i className="fa-solid fa-list mr-2"></i> รายการสินค้า ({formatNumber(products.length)} รายการ)
              </h3>

              <div className="flex gap-2">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center text-sm"
                >
                  <i className="fas fa-search mr-1"></i> ค้นหา
                </button>
                <Link href="/product-create">
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center text-sm"
                  >
                    <i className="fas fa-plus mr-1"></i> เพิ่มสินค้า
                  </button>
                </Link>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {/* ตารางแสดงรายการสินค้า */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      รูปภาพ
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      SKU
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อสินค้า
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      หมวดหมู่
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ราคา (บาท)
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      คงเหลือ
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin mb-2"></div>
                          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                        </div>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                        ไม่พบสินค้า
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={getImageUrl(product.imageUrl)}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {product.sku || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {product.category || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                          {product.stock || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={getStatusBadgeClass(product.status)}>
                            {getStatusText(product.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <button
                            onClick={() => editProduct(product)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="แก้ไข"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => confirmDeleteProduct(product.id, product.name)}
                            className="text-red-600 hover:text-red-900"
                            title="ลบ"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* โมดัลแก้ไขสินค้า */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">แก้ไขสินค้า</h3>
                <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={submitEditProduct}>
                <div className="mb-4">
                  <label htmlFor="editProductName" className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อสินค้า:
                  </label>
                  <input
                    type="text"
                    id="editProductName"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="editProductPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      ราคา:
                    </label>
                    <input
                      type="number"
                      id="editProductPrice"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="editProductCategory" className="block text-sm font-medium text-gray-700 mb-1">
                      หมวดหมู่:
                    </label>
                    <select
                      id="editProductCategory"
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="อุปกรณ์อิเล็กทรอนิกส์">อุปกรณ์อิเล็กทรอนิกส์</option>
                      <option value="เสื้อผ้าแฟชั่น">เสื้อผ้าแฟชั่น</option>
                      <option value="อาหารและเครื่องดื่ม">อาหารและเครื่องดื่ม</option>
                      <option value="ความงามและสุขภาพ">ความงามและสุขภาพ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="editProductStock" className="block text-sm font-medium text-gray-700 mb-1">
                      คงเหลือ:
                    </label>
                    <input
                      type="number"
                      id="editProductStock"
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="editProductStatus" className="block text-sm font-medium text-gray-700 mb-1">
                      สถานะ:
                    </label>
                    <select
                      id="editProductStatus"
                      value={editingProduct.status}
                      onChange={(e) => setEditingProduct({...editingProduct, status: e.target.value as 'active' | 'inactive'})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="active">ใช้งาน</option>
                      <option value="inactive">ไม่ใช้งาน</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? (
                      <span className="flex items-center">
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i> กำลังบันทึก...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <i className="fa-solid fa-save mr-2"></i> บันทึกการเปลี่ยนแปลง
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* โมดัลยืนยันการลบสินค้า */}
      {showDeleteConfirm && productToDelete && (
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
                คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "{productToDelete.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={deleteProduct}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;