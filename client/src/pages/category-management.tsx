import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/Layout';
import { Category } from '@shared/schema';
import { Loader2, Plus, Pencil, Trash2, Save, X } from 'lucide-react';

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
}

const CategoryManagement: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: '',
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  // ดึงข้อมูลหมวดหมู่สินค้า
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    enabled: !!user,
  });

  // Mutation สำหรับเพิ่มหมวดหมู่สินค้า
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategory: CategoryFormData) => {
      const res = await apiRequest('POST', '/api/categories', newCategory);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsAdding(false);
      resetForm();
      toast({
        title: 'เพิ่มหมวดหมู่สินค้าสำเร็จ',
        description: 'หมวดหมู่สินค้าใหม่ถูกเพิ่มเรียบร้อยแล้ว',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation สำหรับแก้ไขหมวดหมู่สินค้า
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryFormData }) => {
      const res = await apiRequest('PUT', `/api/categories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsEditing(null);
      resetForm();
      toast({
        title: 'แก้ไขหมวดหมู่สินค้าสำเร็จ',
        description: 'ข้อมูลหมวดหมู่สินค้าถูกอัปเดตเรียบร้อยแล้ว',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    addCategoryMutation.mutate(formData);
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing !== null) {
      updateCategoryMutation.mutate({ id: isEditing, data: formData });
    }
  };

  const handleEditClick = (category: Category) => {
    setIsEditing(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
    });
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 font-kanit">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            จัดการหมวดหมู่สินค้า
          </h1>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus size={18} className="mr-2" />
              เพิ่มหมวดหมู่
            </button>
          )}
        </div>

        {isAdding && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">เพิ่มหมวดหมู่สินค้าใหม่</h2>
              <button
                onClick={() => {
                  setIsAdding(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCategory}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="ระบุชื่อหมวดหมู่"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ไอคอน (CSS class หรือ URL รูปภาพ)
                  </label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="เช่น fa-box, https://example.com/icon.png"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="ระบุรายละเอียดหมวดหมู่สินค้า"
                />
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    resetForm();
                  }}
                  className="px-4 py-2 mr-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={addCategoryMutation.isPending}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed"
                >
                  {addCategoryMutation.isPending && (
                    <Loader2 size={18} className="mr-2 animate-spin" />
                  )}
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        )}

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
                      ชื่อหมวดหมู่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รายละเอียด
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories?.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                        ยังไม่มีหมวดหมู่สินค้า กดปุ่ม "เพิ่มหมวดหมู่" เพื่อเริ่มต้น
                      </td>
                    </tr>
                  )}
                  {categories?.map((category) => (
                    <tr key={category.id}>
                      {isEditing === category.id ? (
                        <td colSpan={3} className="px-6 py-4">
                          <form onSubmit={handleUpdateCategory} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  ชื่อหมวดหมู่ <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleInputChange}
                                  required
                                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  ไอคอน
                                </label>
                                <input
                                  type="text"
                                  name="icon"
                                  value={formData.icon}
                                  onChange={handleInputChange}
                                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                รายละเอียด
                              </label>
                              <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={2}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditing(null);
                                  resetForm();
                                }}
                                className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                              >
                                ยกเลิก
                              </button>
                              <button
                                type="submit"
                                disabled={updateCategoryMutation.isPending}
                                className="flex items-center px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300"
                              >
                                {updateCategoryMutation.isPending && (
                                  <Loader2 size={16} className="mr-1 animate-spin" />
                                )}
                                <Save size={16} className="mr-1" />
                                บันทึก
                              </button>
                            </div>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {category.icon && (
                                <div className="mr-2">
                                  {category.icon.startsWith('http') ? (
                                    <img src={category.icon} alt="" className="w-6 h-6" />
                                  ) : (
                                    <i className={category.icon}></i>
                                  )}
                                </div>
                              )}
                              <span className="font-medium">{category.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">
                              {category.description || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditClick(category)}
                              className="text-purple-600 hover:text-purple-900 mr-3"
                            >
                              <Pencil size={18} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoryManagement;