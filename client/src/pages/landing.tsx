import React from 'react';
import { Link } from 'wouter';
import { 
  Truck, 
  PackageCheck, 
  Zap, 
  Shield, 
  CreditCard, 
  BarChart3, 
  Users, 
  Star, 
  Clock, 
  ChevronRight, 
  CheckCircle2,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Logo from '@/components/Logo';

const LandingPage: React.FC = () => {
  return (
    <div className="bg-white font-kanit min-h-screen">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 py-4">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Logo size="medium" />
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition">คุณสมบัติ</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition">ราคา</a>
            <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition">ลูกค้าของเรา</a>
            <a href="#faq" className="text-gray-600 hover:text-blue-600 transition">คำถามที่พบบ่อย</a>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button variant="outline" className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-50">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/auth">
              <Button className="rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white">ลงทะเบียน</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent leading-tight">
                จัดการการขนส่งของคุณได้อย่างมีประสิทธิภาพ
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                ShipSync ช่วยให้คุณจัดการพัสดุและการขนส่งได้ง่ายดาย ด้วยการสร้างและพิมพ์ลาเบลพัสดุ ติดตามสถานะการส่ง และจัดการคำสั่งซื้อทั้งหมดในที่เดียว
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-500 text-white h-12 px-8 rounded-full text-base font-medium">
                    เริ่มต้นใช้งานฟรี
                  </Button>
                </Link>
                <a href="#demo">
                  <Button variant="outline" className="border-blue-600 text-blue-600 h-12 px-8 rounded-full text-base font-medium hover:bg-blue-50">
                    ชมการสาธิต
                  </Button>
                </a>
              </div>
              <div className="mt-8 flex items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-gray-${i * 100}`}>
                    </div>
                  ))}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-900">ลูกค้ากว่า 5,000+ คน</p>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">4.9/5 จากผู้ใช้งานจริง</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="absolute -top-8 -right-8 w-64 h-64 bg-blue-100 rounded-full opacity-50 filter blur-3xl"></div>
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-cyan-100 rounded-full opacity-50 filter blur-3xl"></div>
              <div className="relative bg-white p-4 rounded-xl shadow-xl">
                <img 
                  src="/assets/shipping-icon.png" 
                  alt="ShipSync Dashboard" 
                  className="rounded-lg shadow-md w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">คุณสมบัติหลักของ ShipSync</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              ระบบของเราออกแบบมาเพื่อทำให้การจัดการขนส่งและพัสดุเป็นเรื่องง่าย มีประสิทธิภาพ และประหยัดเวลา
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <PackageCheck className="h-10 w-10 text-blue-600" />,
                title: 'สร้างลาเบลพัสดุได้อย่างรวดเร็ว',
                description: 'สร้างและพิมพ์ลาเบลพัสดุสำหรับบริษัทขนส่งชั้นนำได้ทันที ไม่ต้องพิมพ์ข้อมูลซ้ำ'
              },
              {
                icon: <Truck className="h-10 w-10 text-blue-600" />,
                title: 'ติดตามพัสดุแบบเรียลไทม์',
                description: 'ติดตามสถานะพัสดุของคุณได้ตลอดเวลา รู้ทุกความเคลื่อนไหวของการจัดส่ง'
              },
              {
                icon: <Shield className="h-10 w-10 text-blue-600" />,
                title: 'ระบบความปลอดภัยสูง',
                description: 'ข้อมูลของคุณปลอดภัยด้วยระบบรักษาความปลอดภัยและการเข้ารหัสระดับสูง'
              },
              {
                icon: <CreditCard className="h-10 w-10 text-blue-600" />,
                title: 'ระบบเครดิตที่ยืดหยุ่น',
                description: 'ระบบเติมเงินเครดิตที่ใช้งานง่าย ชำระเฉพาะส่วนที่ใช้งานจริงเท่านั้น'
              },
              {
                icon: <BarChart3 className="h-10 w-10 text-blue-600" />,
                title: 'รายงานและการวิเคราะห์',
                description: 'ดูข้อมูลสถิติและรายงานที่ช่วยให้คุณเข้าใจธุรกิจได้ดีขึ้น'
              },
              {
                icon: <Zap className="h-10 w-10 text-blue-600" />,
                title: 'การทำงานที่รวดเร็ว',
                description: 'ระบบที่ทำงานได้อย่างรวดเร็ว ลดเวลาในการจัดการคำสั่งซื้อและการขนส่ง'
              }
            ].map((feature, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow p-6 rounded-xl">
                <CardContent className="p-0">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-blue-50 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">วิธีการใช้งาน ShipSync</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              เพียงไม่กี่ขั้นตอนก็สามารถจัดการการขนส่งของคุณได้อย่างมีประสิทธิภาพ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'สร้างบัญชีและเติมเครดิต',
                description: 'สมัครบัญชีใหม่และเติมเครดิตเพื่อเริ่มใช้งานระบบ'
              },
              {
                step: '02',
                title: 'สร้างออเดอร์และพิมพ์ลาเบล',
                description: 'กรอกข้อมูลผู้รับและเลือกบริการขนส่งที่ต้องการ'
              },
              {
                step: '03',
                title: 'ติดตามและจัดการพัสดุ',
                description: 'ติดตามสถานะการจัดส่งและจัดการคำสั่งซื้อทั้งหมดในที่เดียว'
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white p-8 rounded-xl shadow-md">
                  <div className="text-5xl font-bold text-blue-100 mb-4">{step.step}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="h-8 w-8 text-blue-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">รูปแบบราคาที่ยืดหยุ่น</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              เลือกแพ็คเกจที่เหมาะกับธุรกิจของคุณ ไม่มีค่าใช้จ่ายซ่อนเร้น
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'แพ็คเกจเริ่มต้น',
                price: '0',
                description: 'เหมาะสำหรับผู้ใช้งานรายใหม่ที่ต้องการทดลองใช้ระบบ',
                features: [
                  'สร้างออเดอร์ได้ 10 ออเดอร์',
                  'ติดตามสถานะพัสดุ',
                  'พิมพ์ลาเบลพัสดุ',
                  'ใช้งานได้ 7 วัน'
                ],
                buttonText: 'เริ่มต้นใช้งานฟรี',
                popular: false
              },
              {
                name: 'แพ็คเกจธุรกิจ',
                price: '1,590',
                description: 'เหมาะสำหรับธุรกิจขนาดเล็กถึงขนาดกลาง',
                features: [
                  'เครดิต 2,000 บาท',
                  'ใช้ได้กับทุกบริการขนส่ง',
                  'รายงานและการวิเคราะห์',
                  'API สำหรับเชื่อมต่อกับระบบของคุณ',
                  'สนับสนุนตลอด 24 ชั่วโมง'
                ],
                buttonText: 'เลือกแพ็คเกจนี้',
                popular: true
              },
              {
                name: 'แพ็คเกจองค์กร',
                price: '4,990',
                description: 'เหมาะสำหรับธุรกิจขนาดใหญ่ที่มีความต้องการสูง',
                features: [
                  'เครดิต 6,000 บาท',
                  'ระบบจัดการทีมงาน',
                  'การติดตามพัสดุขั้นสูง',
                  'การอัปโหลดข้อมูลจำนวนมาก',
                  'API แบบไม่จำกัด',
                  'ผู้จัดการบัญชีส่วนตัว'
                ],
                buttonText: 'ติดต่อฝ่ายขาย',
                popular: false
              }
            ].map((plan, index) => (
              <div key={index} className={`relative border ${plan.popular ? 'border-blue-500' : 'border-gray-200'} rounded-xl shadow-md overflow-hidden`}>
                {plan.popular && (
                  <div className="bg-blue-500 text-white py-2 px-8 absolute top-0 right-0 transform translate-x-8 translate-y-4 rotate-45">
                    <span className="text-sm font-medium">ยอดนิยม</span>
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== '0' && <span className="text-gray-500 ml-2">บาท</span>}
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-blue-500 mr-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white' 
                      : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'}`}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-gradient-to-b from-white to-blue-50 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">ลูกค้าของเรากล่าวว่า</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              ความเห็นจากผู้ใช้งานจริงที่ใช้ ShipSync ในการจัดการธุรกิจของพวกเขา
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'คุณนภัส จันทร์เจริญ',
                role: 'เจ้าของร้านออนไลน์',
                comment: 'ShipSync ช่วยประหยัดเวลาในการจัดการออเดอร์ของฉันได้มาก ไม่ต้องกรอกที่อยู่ซ้ำๆ อีกต่อไป การพิมพ์ลาเบลก็ทำได้ในคลิกเดียว',
                rating: 5
              },
              {
                name: 'คุณสมชาย วงศ์สุวรรณ',
                role: 'ผู้จัดการโลจิสติกส์',
                comment: 'เราใช้ ShipSync กับทีมงานกว่า 10 คน ระบบรองรับการทำงานหลายคนได้ดีมาก มีรายงานที่ช่วยให้เราเห็นภาพรวมของการขนส่งได้ชัดเจน',
                rating: 5
              },
              {
                name: 'คุณมนัสนันท์ ศรีวิชัย',
                role: 'ผู้ประกอบการ SME',
                comment: 'ประทับใจกับความเร็วในการทำงานและความง่ายในการใช้งาน ช่วยให้ธุรกิจของเราจัดการคำสั่งซื้อได้มากขึ้นโดยใช้เวลาน้อยลง',
                rating: 4
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-white border border-gray-200 hover:shadow-md transition-shadow p-6 rounded-xl">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {Array(5).fill(0).map((_, starIndex) => (
                      <Star key={starIndex} className={`h-5 w-5 ${starIndex < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6">"{testimonial.comment}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-2xl font-semibold text-center mb-10">บริการขนส่งที่เราร่วมมือด้วย</h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {[
              { name: 'Flash Express', logo: '🚚' },
              { name: 'Kerry Express', logo: '🚚' },
              { name: 'J&T Express', logo: '🚚' },
              { name: 'Thailand Post', logo: '🚚' },
              { name: 'Ninja Van', logo: '🚚' }
            ].map((partner, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-4xl mb-2">{partner.logo}</div>
                <span className="text-gray-600">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-blue-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">คำถามที่พบบ่อย</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              คำตอบสำหรับคำถามที่พบบ่อยเกี่ยวกับบริการของเรา
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {[
              {
                question: 'ShipSync คิดค่าบริการอย่างไร?',
                answer: 'ShipSync คิดค่าบริการแบบเติมเครดิต โดยจะหักเครดิต 25 บาทต่อหนึ่งออเดอร์ที่สร้าง คุณสามารถเติมเครดิตได้หลายระดับตามการใช้งาน'
              },
              {
                question: 'สามารถติดตามพัสดุได้อย่างไรบ้าง?',
                answer: 'คุณสามารถติดตามพัสดุได้ผ่านแดชบอร์ดของ ShipSync โดยระบบจะแสดงสถานะปัจจุบันของพัสดุทั้งหมดของคุณ และส่งการแจ้งเตือนเมื่อมีการเปลี่ยนแปลงสถานะ'
              },
              {
                question: 'รองรับการพิมพ์ลาเบลพัสดุกับบริษัทขนส่งอะไรบ้าง?',
                answer: 'ShipSync รองรับการพิมพ์ลาเบลพัสดุกับบริษัทขนส่งชั้นนำในไทย เช่น Flash Express, Kerry Express, J&T Express, Thailand Post, Ninja Van และอื่นๆ อีกมากมาย'
              },
              {
                question: 'มีระบบ API สำหรับเชื่อมต่อกับระบบของฉันหรือไม่?',
                answer: 'ใช่ ShipSync มี API ที่ครอบคลุมสำหรับการเชื่อมต่อกับระบบของคุณ เช่น ระบบ e-commerce หรือระบบจัดการสินค้าคงคลัง คุณสามารถดูเอกสาร API ได้ในพื้นที่สมาชิก'
              },
              {
                question: 'ต้องติดตั้งซอฟต์แวร์เพิ่มเติมหรือไม่?',
                answer: 'ไม่จำเป็น ShipSync เป็นระบบออนไลน์ที่ทำงานบนเว็บเบราว์เซอร์ คุณสามารถใช้งานได้ทันทีผ่านคอมพิวเตอร์ แท็บเล็ต หรือสมาร์ทโฟน'
              },
              {
                question: 'มีบริการสนับสนุนลูกค้าหรือไม่?',
                answer: 'เรามีทีมสนับสนุนลูกค้าที่พร้อมช่วยเหลือคุณตลอด 24 ชั่วโมงผ่านช่องทางต่างๆ เช่น แชท อีเมล และโทรศัพท์'
              }
            ].map((faq, index) => (
              <div key={index} className="mb-6 bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">พร้อมเริ่มจัดการการขนส่งอย่างมีประสิทธิภาพ?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            เริ่มต้นใช้งาน ShipSync วันนี้และสัมผัสประสบการณ์การจัดการพัสดุที่ง่ายและรวดเร็วกว่าที่เคย
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 h-12 px-8 rounded-full text-base font-medium">
                เริ่มต้นใช้งานฟรี
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="outline" className="border-white text-white hover:bg-blue-400 h-12 px-8 rounded-full text-base font-medium">
                ติดต่อฝ่ายขาย
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">เกี่ยวกับเรา</h3>
              <p className="text-gray-400">
                ShipSync เป็นระบบจัดการการขนส่งที่ช่วยให้ธุรกิจทุกขนาดจัดการพัสดุและคำสั่งซื้อได้อย่างมีประสิทธิภาพ
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">บริการของเรา</h3>
              <ul className="space-y-2 text-gray-400">
                <li>การสร้างลาเบลพัสดุ</li>
                <li>การติดตามพัสดุ</li>
                <li>การจัดการคำสั่งซื้อ</li>
                <li>รายงานและการวิเคราะห์</li>
                <li>API สำหรับนักพัฒนา</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">ติดต่อเรา</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  123 ถ.สุขุมวิท, กรุงเทพฯ 10110
                </li>
                <li className="flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  02-123-4567
                </li>
                <li className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  support@shipsync.co.th
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">ติดตามเรา</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} ShipSync. สงวนลิขสิทธิ์ทั้งหมด.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;