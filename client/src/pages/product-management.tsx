import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/Layout';
import { Product, Category } from '@shared/schema';
import { Loader2, Plus, Pencil, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'wouter';

const ProductManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useNavigate();

  // ดึงข้อมูลสินค้า
  const { 
    data: products, 
    isLoading: isLoadingProducts 
  } = useQuery<Product[]>({
    queryKey: ['/api/products', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/products?categoryId=${selectedCategory}` 
        : '/api/products';
      
      const res = await apiRequest('GET', url);
      const result = await res.json();
      return result.data;
    },
    enabled: !!user,
  });

  // ดึงข้อมูลหมวดหมู่สินค้า
  const { 
    data: categories,
    isLoading: isLoadingCategories
  } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    enabled: !!user,
  });

  // กรองสินค้าตามคำค้นหา
  const filteredProducts = searchTerm && products
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  const handleAddProduct = () => {
    navigate('/product-create');
  };

  const handleEditProduct = (productId: number) => {
    navigate(`/product-edit/${productId}`);
  };

  const isLoading = isLoadingProducts || isLoadingCategories;

  return (
    <Layout>
      <div className="container mx-auto p-4 font-kanit">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            จัดการสินค้า
          </h1>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="ค้นหาสินค้า..."
              />
            </div>
            <div className="relative flex-1 md:w-48">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={18} className="text-gray-400" />
              </div>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-10"
              >
                <option value="">ทุกหมวดหมู่</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddProduct}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus size={18} className="mr-2" />
              เพิ่มสินค้า
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 size={32} className="animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รหัสสินค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อสินค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      หมวดหมู่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ราคา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สต็อค
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        {searchTerm 
                          ? 'ไม่พบสินค้าที่ตรงกับคำค้นหา' 
                          : selectedCategory 
                            ? 'ไม่พบสินค้าในหมวดหมู่นี้' 
                            : 'ยังไม่มีสินค้า กดปุ่ม "เพิ่มสินค้า" เพื่อเริ่มต้น'}
                      </td>
                    </tr>
                  )}
                  {filteredProducts?.map((product) => {
                    const category = categories?.find(c => c.id === product.categoryId);
                    
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.sku}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {product.imageUrl && (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="h-10 w-10 object-cover rounded-md mr-3"
                              />
                            )}
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {product.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {category?.name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {parseFloat(product.price.toString()).toLocaleString('th-TH')} บาท
                          </div>
                          {product.cost && (
                            <div className="text-xs text-gray-500">
                              ทุน: {parseFloat(product.cost.toString()).toLocaleString('th-TH')} บาท
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${product.stock! > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {product.stock} ชิ้น
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditProduct(product.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            <Pencil size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductManagement;