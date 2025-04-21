const printWindow = window.open('', '_blank');

          if (!printWindow) {
            toast({
              title: 'เกิดข้อผิดพลาด',
              description: 'ไม่สามารถเปิดหน้าต่างพิมพ์ได้ โปรดตรวจสอบว่าไม่ได้ถูกบล็อกป๊อปอัพ',
              variant: 'destructive',
            });
            return;
          }

          // ตั้งค่า HTML และ CSS สำหรับการพิมพ์
          printWindow.document.write(`
            <html>
            <head>
              <title>พิมพ์ใบลาเบล - รายการที่เลือก</title>
              <style>
                @page {
                  margin: 0;
                }
                body { 
                  font-family: 'Kanit', sans-serif; 
                  margin: 0; 
                  padding: 0; 
                  background-color: #f5f5f5;
                }
                .page {
                  background-color: white;
                  margin: 20px auto;
                  padding: 0;
                  box-shadow: 0 1px 5px rgba(0,0,0,0.1);
                  position: relative;
                  overflow: hidden;
                  page-break-after: always;
                }
                .label-container { 
                  box-sizing: border-box;
                  padding: 8mm;
                }
              </style>
            </head>
            <body>
              
            </body>
            </html>
          `);

          printWindow.document.close();
          printWindow.print();
          printWindow.close();