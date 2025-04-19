import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ThaiAddressProps {
  onAddressChange: (address: {
    province: string;
    district: string;
    subdistrict: string;
    zipcode: string;
  }) => void;
  initialValues?: {
    province?: string;
    district?: string;
    subdistrict?: string;
    zipcode?: string;
  };
}

interface Province {
  id: string;
  name_th: string;
  name_en?: string;
}

interface District {
  id: string;
  name_th: string;
  name_en?: string;
  province_id?: string;
}

interface Subdistrict {
  id: string;
  name_th: string;
  name_en?: string;
  district_id?: string;
  zip_code: string;
}

const ThaiAddressSelect: React.FC<ThaiAddressProps> = ({
  onAddressChange,
  initialValues = {}
}) => {
  const { toast } = useToast();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(undefined);
  const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>(undefined);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<string | undefined>(undefined);
  const [zipcode, setZipcode] = useState<string>(initialValues.zipcode || "");
  
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);
  const [loadingZipcode, setLoadingZipcode] = useState(false);

  // ฟังก์ชันดึงข้อมูลจังหวัด
  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const response = await apiRequest("GET", "/api/locations/provinces");
      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลจังหวัดได้");
      }
      
      const data = await response.json();
      if (data.success && data.provinces) {
        setProvinces(data.provinces);
        
        // ถ้ามีค่าเริ่มต้น ให้เลือกจังหวัดที่ตรงกัน
        if (initialValues.province) {
          const province = data.provinces.find(p => p.name_th === initialValues.province);
          if (province) {
            setSelectedProvince(province.id);
            fetchDistricts(province.id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching provinces:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลจังหวัดได้",
        variant: "destructive",
      });
    } finally {
      setLoadingProvinces(false);
    }
  };
  
  // ฟังก์ชันดึงข้อมูลอำเภอตามจังหวัด
  const fetchDistricts = async (provinceId: string) => {
    if (!provinceId) return;
    
    setLoadingDistricts(true);
    setDistricts([]);
    setSelectedDistrict(undefined);
    setSelectedSubdistrict(undefined);
    setZipcode("");
    
    try {
      const response = await apiRequest("GET", `/api/locations/districts?provinceId=${provinceId}`);
      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลอำเภอได้");
      }
      
      const data = await response.json();
      if (data.success && data.districts) {
        setDistricts(data.districts);
        
        // ถ้ามีค่าเริ่มต้น ให้เลือกอำเภอที่ตรงกัน
        if (initialValues.district) {
          const district = data.districts.find(d => d.name_th === initialValues.district);
          if (district) {
            setSelectedDistrict(district.id);
            fetchSubdistricts(district.id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลอำเภอได้",
        variant: "destructive",
      });
    } finally {
      setLoadingDistricts(false);
    }
  };
  
  // ฟังก์ชันดึงข้อมูลตำบลตามอำเภอ
  const fetchSubdistricts = async (districtId: string) => {
    if (!districtId) return;
    
    setLoadingSubdistricts(true);
    setSubdistricts([]);
    setSelectedSubdistrict(undefined);
    setZipcode("");
    
    try {
      const response = await apiRequest("GET", `/api/locations/subdistricts?districtId=${districtId}`);
      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลตำบลได้");
      }
      
      const data = await response.json();
      if (data.success && data.subdistricts) {
        setSubdistricts(data.subdistricts);
        
        // ถ้ามีค่าเริ่มต้น ให้เลือกตำบลที่ตรงกัน
        if (initialValues.subdistrict) {
          const subdistrict = data.subdistricts.find(s => s.name_th === initialValues.subdistrict);
          if (subdistrict) {
            setSelectedSubdistrict(subdistrict.id);
            setZipcode(subdistrict.zip_code);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching subdistricts:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลตำบลได้",
        variant: "destructive",
      });
    } finally {
      setLoadingSubdistricts(false);
    }
  };

  // ฟังก์ชันดึงข้อมูลจากรหัสไปรษณีย์
  const fetchDataFromZipcode = async (zipcode: string) => {
    if (!zipcode || zipcode.length !== 5) return;
    
    setLoadingZipcode(true);
    
    try {
      const response = await apiRequest("GET", `/api/locations/zipcode/${zipcode}`);
      const data = await response.json();
      
      if (data.success && data.address) {
        const provinceName = data.address.province || "";
        const districtName = data.address.district || "";
        const subdistrictName = data.address.subdistrict || "";
        
        // ตั้งค่าข้อมูลที่อยู่
        updateAddressInfo({
          province: provinceName,
          district: districtName,
          subdistrict: subdistrictName,
          zipcode: zipcode
        });
        
        // ค้นหาและเลือกจังหวัดใน dropdown
        const foundProvince = provinces.find((p: Province) => p.name_th === provinceName);
        if (foundProvince) {
          setSelectedProvince(foundProvince.id);
          await fetchDistricts(foundProvince.id);
          
          // หลังจากได้อำเภอแล้ว ค้นหาอำเภอที่ตรงกับข้อมูลจาก API
          setTimeout(() => {
            const foundDistrict = districts.find((d: District) => d.name_th === districtName);
            if (foundDistrict) {
              setSelectedDistrict(foundDistrict.id);
              fetchSubdistricts(foundDistrict.id).then(() => {
                // หลังจากได้ตำบลแล้ว ให้เลือกตำบลที่ตรงกับข้อมูลจาก API โดยอัตโนมัติ
                setTimeout(() => {
                  const foundSubdistrict = subdistricts.find((s: Subdistrict) => s.name_th === subdistrictName);
                  if (foundSubdistrict) {
                    setSelectedSubdistrict(foundSubdistrict.id);
                  }
                }, 300);
              });
            }
          }, 300);
        }
        
        toast({
          title: "ดึงข้อมูลสำเร็จ",
          description: data.note 
            ? `${data.note} - ${provinceName}, ${districtName}, ${subdistrictName}` 
            : `ได้รับข้อมูลจากรหัสไปรษณีย์ ${zipcode} เรียบร้อยแล้ว`,
        });
      } else {
        throw new Error(data.message || "ไม่สามารถดึงข้อมูลจากรหัสไปรษณีย์ได้");
      }
    } catch (error) {
      console.error("Error fetching address from zipcode:", error);
      toast({
        title: "ไม่สามารถดึงข้อมูลได้",
        description: "ไม่พบข้อมูลสำหรับรหัสไปรษณีย์นี้ กรุณากรอกข้อมูลที่อยู่ด้วยตนเอง",
        variant: "destructive",
      });
    } finally {
      setLoadingZipcode(false);
    }
  };

  // อัพเดทข้อมูลที่อยู่และส่งค่ากลับไปยัง parent component
  const updateAddressInfo = (address: {
    province: string;
    district: string;
    subdistrict: string;
    zipcode: string;
  }) => {
    onAddressChange(address);
  };

  // จัดการเมื่อเลือกจังหวัด
  const handleProvinceChange = (provinceId: string) => {
    setSelectedProvince(provinceId);
    const province = provinces.find(p => p.id === provinceId);
    if (province) {
      updateAddressInfo({
        province: province.name_th,
        district: "",
        subdistrict: "",
        zipcode: ""
      });
      fetchDistricts(provinceId);
    }
  };

  // จัดการเมื่อเลือกอำเภอ
  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    const district = districts.find(d => d.id === districtId);
    if (district) {
      const currentProvince = provinces.find(p => p.id === selectedProvince);
      updateAddressInfo({
        province: currentProvince ? currentProvince.name_th : "",
        district: district.name_th,
        subdistrict: "",
        zipcode: ""
      });
      fetchSubdistricts(districtId);
    }
  };

  // จัดการเมื่อเลือกตำบล
  const handleSubdistrictChange = (subdistrictId: string) => {
    setSelectedSubdistrict(subdistrictId);
    const subdistrict = subdistricts.find(s => s.id === subdistrictId);
    if (subdistrict) {
      const currentProvince = provinces.find(p => p.id === selectedProvince);
      const currentDistrict = districts.find(d => d.id === selectedDistrict);
      
      setZipcode(subdistrict.zip_code);
      
      updateAddressInfo({
        province: currentProvince ? currentProvince.name_th : "",
        district: currentDistrict ? currentDistrict.name_th : "",
        subdistrict: subdistrict.name_th,
        zipcode: subdistrict.zip_code
      });
    }
  };

  // จัดการเมื่อกรอกรหัสไปรษณีย์
  const handleZipcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZipcode = e.target.value;
    setZipcode(newZipcode);
    
    if (newZipcode.length === 5) {
      fetchDataFromZipcode(newZipcode);
    }
  };

  // โหลดข้อมูลจังหวัดเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    fetchProvinces();
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="province">จังหวัด</Label>
          <Select
            value={selectedProvince}
            onValueChange={handleProvinceChange}
            disabled={loadingProvinces}
          >
            <SelectTrigger id="province" className="w-full">
              <SelectValue placeholder={loadingProvinces ? "กำลังโหลด..." : "เลือกจังหวัด"} />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.id} value={province.id}>
                  {province.name_th}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">อำเภอ/เขต</Label>
          <Select
            value={selectedDistrict}
            onValueChange={handleDistrictChange}
            disabled={!selectedProvince || loadingDistricts}
          >
            <SelectTrigger id="district" className="w-full">
              <SelectValue placeholder={loadingDistricts ? "กำลังโหลด..." : selectedProvince ? "เลือกอำเภอ/เขต" : "กรุณาเลือกจังหวัดก่อน"} />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name_th}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="subdistrict">ตำบล/แขวง</Label>
          <Select
            value={selectedSubdistrict}
            onValueChange={handleSubdistrictChange}
            disabled={!selectedDistrict || loadingSubdistricts}
          >
            <SelectTrigger id="subdistrict" className="w-full">
              <SelectValue placeholder={loadingSubdistricts ? "กำลังโหลด..." : selectedDistrict ? "เลือกตำบล/แขวง" : "กรุณาเลือกอำเภอก่อน"} />
            </SelectTrigger>
            <SelectContent>
              {subdistricts.map((subdistrict) => (
                <SelectItem key={subdistrict.id} value={subdistrict.id}>
                  {subdistrict.name_th}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipcode">รหัสไปรษณีย์</Label>
          <Input
            id="zipcode"
            value={zipcode}
            onChange={handleZipcodeChange}
            className="w-full"
            placeholder="กรอกรหัสไปรษณีย์ 5 หลัก"
            maxLength={5}
            disabled={loadingZipcode}
          />
        </div>
      </div>
    </div>
  );
};

export default ThaiAddressSelect;