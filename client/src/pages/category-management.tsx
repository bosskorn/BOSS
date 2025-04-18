import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/Layout';
import { Category } from '@shared/schema';
import { Loader2, Plus, Pencil, ChevronDown, ChevronRight, FolderTree, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

const CategoryManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    parentId: null as number | null,
  });
  
  // ดึงข้อมูลหมวดหมู่ทั้งหมด
  const { 
    data: categories, 
    isLoading,
    refetch 
  } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    enabled: !!user,
  });
  
  // Mutation สำหรับสร้างหมวดหมู่ใหม่
  const createCategory = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest('POST', '/api/categories', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'สร้างหมวดหมู่สำเร็จ',
        description: 'เพิ่มหมวดหมู่สินค้าใหม่เรียบร้อยแล้ว',
      });
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถสร้างหมวดหมู่ได้',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation สำหรับแก้ไขหมวดหมู่
  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<typeof formData> }) => {
      const res = await apiRequest('PUT', `/api/categories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'แก้ไขหมวดหมู่สำเร็จ',
        description: 'อัปเดตข้อมูลหมวดหมู่สินค้าเรียบร้อยแล้ว',
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถแก้ไขหมวดหมู่ได้',
        variant: 'destructive',
      });
    },
  });
  
  // ล้างฟอร์มข้อมูล
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      parentId: null,
    });
    setSelectedCategory(null);
  };
  
  // เริ่มการแก้ไขหมวดหมู่
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive || true,
      parentId: category.parentId,
    });
    setIsEditDialogOpen(true);
  };
  
  // บันทึกข้อมูลหมวดหมู่
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'กรุณากรอกชื่อหมวดหมู่',
        variant: 'destructive',
      });
      return;
    }
    
    if (isEditDialogOpen && selectedCategory) {
      updateCategory.mutate({ 
        id: selectedCategory.id, 
        data: formData 
      });
    } else {
      createCategory.mutate(formData);
    }
  };
  
  // ฟังก์ชันช่วยในการแสดงโครงสร้างหมวดหมู่แบบ tree
  const getMainCategories = () => {
    if (!categories) return [];
    return categories.filter(cat => cat.parentId === null);
  };
  
  const getChildCategories = (parentId: number) => {
    if (!categories) return [];
    return categories.filter(cat => cat.parentId === parentId);
  };
  
  const toggleExpand = (categoryId: number) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };
  
  const isExpanded = (categoryId: number) => {
    return expandedCategories.includes(categoryId);
  };
  
  // ตัวแสดงหมวดหมู่ย่อยแบบ recursive
  const renderCategoryItem = (category: Category, level: number = 0) => {
    const childCategories = getChildCategories(category.id);
    const hasChildren = childCategories.length > 0;
    
    return (
      <div key={category.id} className="category-item" style={{ marginLeft: `${level * 16}px` }}>
        <div className={`flex items-center p-3 hover:bg-gray-50 rounded-md ${!category.isActive ? 'opacity-60' : ''}`}>
          <div className="flex-grow flex items-center">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(category.id)}
                className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {isExpanded(category.id) ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
            ) : (
              <div className="w-[18px] mr-2" />
            )}
            
            <FolderTree size={18} className="text-purple-500 mr-2" />
            
            <div className="flex-grow font-medium">
              {category.name}
              {!category.isActive && (
                <Badge variant="outline" className="ml-2 text-xs">
                  ไม่ใช้งาน
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(category)}
              className="h-8 w-8 text-gray-500 hover:text-purple-600"
            >
              <Pencil size={16} />
            </Button>
          </div>
        </div>
        
        {isExpanded(category.id) && hasChildren && (
          <div className="children-container pl-2 border-l border-gray-200 ml-4 mt-1">
            {childCategories.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4 font-kanit">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0">
            จัดการหมวดหมู่สินค้า
          </h1>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              className="flex items-center"
            >
              <RefreshCw size={16} className="mr-1" />
              รีเฟรช
            </Button>
            
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              className="flex items-center bg-purple-600 hover:bg-purple-700"
            >
              <Plus size={16} className="mr-1" />
              เพิ่มหมวดหมู่
            </Button>
          </div>
        </div>
        
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-lg">รายการหมวดหมู่สินค้า</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 size={24} className="animate-spin text-purple-600 mr-2" />
                <span>กำลังโหลดข้อมูล...</span>
              </div>
            ) : categories?.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FolderTree size={48} className="text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">ยังไม่มีหมวดหมู่สินค้า</h3>
                <p className="text-gray-500 mb-3">คลิกปุ่ม "เพิ่มหมวดหมู่" เพื่อเริ่มสร้างหมวดหมู่สินค้าแรกของคุณ</p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  variant="outline" 
                  className="flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  เพิ่มหมวดหมู่แรก
                </Button>
              </div>
            ) : (
              <div className="p-3">
                {getMainCategories().map(category => renderCategoryItem(category))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Dialog สำหรับเพิ่มหมวดหมู่ใหม่ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="font-kanit">
          <DialogHeader>
            <DialogTitle>เพิ่มหมวดหมู่สินค้า</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลด้านล่างเพื่อสร้างหมวดหมู่สินค้าใหม่
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">ชื่อหมวดหมู่ <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ระบุชื่อหมวดหมู่"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">รายละเอียด</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="parent">หมวดหมู่หลัก</Label>
                <Select
                  value={formData.parentId?.toString() || ''}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    parentId: value ? parseInt(value) : null 
                  })}
                >
                  <SelectTrigger id="parent">
                    <SelectValue placeholder="เลือกหมวดหมู่หลัก (ถ้ามี)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ไม่มีหมวดหมู่หลัก</SelectItem>
                    {categories?.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="isActive">เปิดใช้งาน</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(false);
                }}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit"
                disabled={createCategory.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {createCategory.isPending && (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                )}
                บันทึก
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog สำหรับแก้ไขหมวดหมู่ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="font-kanit">
          <DialogHeader>
            <DialogTitle>แก้ไขหมวดหมู่สินค้า</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลหมวดหมู่สินค้า
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">ชื่อหมวดหมู่ <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ระบุชื่อหมวดหมู่"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">รายละเอียด</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-parent">หมวดหมู่หลัก</Label>
                <Select
                  value={formData.parentId?.toString() || ''}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    parentId: value ? parseInt(value) : null 
                  })}
                  disabled={!!selectedCategory && getChildCategories(selectedCategory.id).length > 0}
                >
                  <SelectTrigger id="edit-parent">
                    <SelectValue placeholder="เลือกหมวดหมู่หลัก (ถ้ามี)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ไม่มีหมวดหมู่หลัก</SelectItem>
                    {categories
                      ?.filter(c => c.id !== selectedCategory?.id)
                      .map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {!!selectedCategory && getChildCategories(selectedCategory.id).length > 0 && (
                  <p className="text-xs text-amber-600">
                    ไม่สามารถย้ายหมวดหมู่ได้เนื่องจากมีหมวดหมู่ย่อยอยู่
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="edit-isActive">เปิดใช้งาน</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsEditDialogOpen(false);
                }}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit"
                disabled={updateCategory.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {updateCategory.isPending && (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                )}
                บันทึก
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CategoryManagement;