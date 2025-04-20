import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface PrintLabelProps {
  trackingNumber: string;
  labelSize: '100x100mm' | '100x75mm';
  recipientName?: string;
  recipientAddress?: string;
  recipientPhone?: string;
  isCoD?: boolean;
  codAmount?: number;
}

export const PrintLabel: React.FC<PrintLabelProps> = ({
  trackingNumber,
  labelSize,
  recipientName,
  recipientAddress,
  recipientPhone,
  isCoD,
  codAmount,
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && trackingNumber) {
      try {
        JsBarcode(barcodeRef.current, trackingNumber, {
          format: "CODE128",
          lineColor: "#000",
          width: 1.5,
          height: 30,
          displayValue: false,
          margin: 0
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, [trackingNumber]);

  return (
    <div className="print-page" style={{
      width: labelSize === '100x100mm' ? '100mm' : '100mm',
      height: labelSize === '100x100mm' ? '100mm' : '75mm',
      padding: labelSize === '100x100mm' ? '8mm' : '5mm',
    }}>
      <h1 className="logo">PURPLEDASH</h1>
      
      <div className="tracking">
        <div className="title">เลขพัสดุ</div>
        <div className="tracking-number">{trackingNumber}</div>
      </div>
      
      {labelSize === '100x100mm' ? (
        <>
          <div className="section">
            <div className="title">ผู้ส่ง:</div>
            <div className="address">
              PURPLEDASH<br />
              เลขที่ 888 อาคารมณียาเซ็นเตอร์<br />
              ถนนพระราม 4 แขวงลุมพินี<br />
              เขตปทุมวัน กรุงเทพฯ 10330<br />
              โทร: 02-123-4567
            </div>
          </div>
          
          <div className="section">
            <div className="title">ผู้รับ:</div>
            <div className="address">
              <strong>{recipientName || 'ไม่ระบุ'}</strong><br />
              {recipientAddress || 'ไม่ระบุที่อยู่'}<br />
              โทร: {recipientPhone || 'ไม่ระบุ'}
            </div>
          </div>
          
          <div className="barcode">
            <svg ref={barcodeRef} width="100%" height="40px"></svg>
          </div>
        </>
      ) : (
        <>
          <div className="flex-container">
            <div className="sender">
              <div className="title">ผู้ส่ง</div>
              <div className="address">
                PURPLEDASH<br />
                เลขที่ 888 อาคารมณียาเซ็นเตอร์<br />
                ถนนพระราม 4 แขวงลุมพินี<br />
                เขตปทุมวัน กรุงเทพฯ 10330<br />
                โทร: 02-123-4567
              </div>
            </div>
            
            <div className="recipient">
              <div className="title">ผู้รับ</div>
              <div className="address">
                <strong>{recipientName || 'ไม่ระบุ'}</strong><br />
                {recipientAddress || 'ไม่ระบุที่อยู่'}<br />
                โทร: {recipientPhone || 'ไม่ระบุ'}
              </div>
            </div>
          </div>
          
          <div className="barcode-small">
            <div className="label">บาร์โค้ด</div>
            <svg ref={barcodeRef} width="95%" height="30px"></svg>
            <div className="tracking-text">{trackingNumber}</div>
          </div>
        </>
      )}
      
      <div className="footer">
        {isCoD ? (
          <>
            <span>เก็บเงินปลายทาง: {codAmount?.toLocaleString('th-TH', {minimumFractionDigits: 2})} บาท</span>
            {labelSize === '100x100mm' && <span className="cod-badge">COD</span>}
          </>
        ) : (
          'จ่ายเงินแล้ว'
        )}
      </div>
      
      <style jsx>{`
        .print-page {
          font-family: 'Kanit', sans-serif;
          background-color: white;
          position: relative;
          box-sizing: border-box;
        }
        .logo {
          text-align: center;
          color: #8A2BE2;
          font-size: ${labelSize === '100x100mm' ? '22px' : '16px'};
          margin-bottom: ${labelSize === '100x100mm' ? '5mm' : '2mm'};
          font-weight: bold;
        }
        .tracking {
          text-align: center;
          margin-bottom: ${labelSize === '100x100mm' ? '3mm' : '2mm'};
          padding: ${labelSize === '100x100mm' ? '2mm' : '1.5mm'};
          border: 1px solid #8A2BE2;
          border-radius: 3px;
          background-color: #faf6ff;
        }
        .title {
          font-weight: bold;
          font-size: ${labelSize === '100x100mm' ? '13px' : '9px'};
          color: #555;
          ${labelSize === '100x75mm' ? 'background-color: #f7f7f7; padding: 1px 3px; border-radius: 2px;' : ''}
        }
        .tracking-number {
          font-size: ${labelSize === '100x100mm' ? '14px' : '12px'};
          font-weight: bold;
        }
        .section {
          margin-bottom: ${labelSize === '100x100mm' ? '3mm' : '1.5mm'};
        }
        .address {
          font-size: ${labelSize === '100x100mm' ? '12px' : '9px'};
          line-height: ${labelSize === '100x100mm' ? '1.3' : '1.2'};
        }
        .flex-container {
          display: flex;
          margin-top: 2mm;
        }
        .sender {
          flex: 1;
          padding-right: 2mm;
        }
        .recipient {
          flex: 1;
          border-left: 1px solid #ddd;
          padding-left: 2mm;
        }
        .barcode {
          text-align: center;
          margin: ${labelSize === '100x100mm' ? '3mm 0' : '1.5mm 0'};
        }
        .barcode-small {
          margin-top: 1mm;
          text-align: center;
          background-color: #f9f9f9;
          padding: 2mm 0;
          border-radius: 2px;
          border: 1px solid #ddd;
        }
        .label {
          font-size: 9px;
          color: #666;
          margin-bottom: 3px;
        }
        .tracking-text {
          font-size: 9px;
          margin-top: 3px;
          text-align: center;
        }
        .footer {
          text-align: center;
          font-size: ${labelSize === '100x100mm' ? '12px' : '9px'};
          margin-top: ${labelSize === '100x100mm' ? '2mm' : '0'};
          color: #666;
          ${labelSize === '100x75mm' ? 'background-color: #fff6f6; padding: 1mm; border-radius: 2px;' : ''}
        }
        .cod-badge {
          display: inline-block;
          background-color: #8A2BE2;
          color: white;
          padding: 1mm 2mm;
          border-radius: 3px;
          margin-left: 2mm;
          font-size: 11px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default PrintLabel;
