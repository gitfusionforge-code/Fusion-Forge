import { sendEmail } from "../email-service";
import { generateFusionForgeReceiptHTML } from "./fusionforge-receipt-template";

export interface ReceiptData {
  orderNumber: string;
  paymentId: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  items: Array<{
    build: {
      id: number;
      name: string;
      category: string;
      price: string;
      components?: Array<{
        id: number;
        name: string;
        type: string;
        specification: string;
        price: number;
      }>;
    };
    quantity: number;
  }>;
  shippingAddress: string;
  transactionDate: string;
  gstNumber?: string;
  companyDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    gst?: string;
  };
}

export function generateReceiptHTML(receiptData: ReceiptData): string {
  const itemsHtml = receiptData.items.map(item => {
    const itemPrice = parseInt(item.build.price) || 0;
    const itemTotal = itemPrice * item.quantity;
    
    // Generate build components HTML if available
    const componentsHtml = item.build.components && item.build.components.length > 0 
      ? item.build.components.map(component => `
          <div style="margin-left: 20px; padding: 3px 0; font-size: 13px; color: #6b7280;">
            • ${component.type}: ${component.specification}
          </div>
        `).join('')
      : '';
    
    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 15px 0; color: #374151; font-weight: 500;">
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">${item.build.name}</div>
          ${componentsHtml}
        </td>
        <td style="padding: 15px 0; text-align: center; color: #6b7280;">${item.quantity}</td>
        <td style="padding: 15px 0; text-align: right; color: #374151;">₹${itemPrice.toLocaleString('en-IN')}</td>
        <td style="padding: 15px 0; text-align: right; font-weight: 600; color: #1f2937;">₹${itemTotal.toLocaleString('en-IN')}</td>
      </tr>
    `;
  }).join('');

  const subtotal = receiptData.amount;
  const gstAmount = Math.round(subtotal * 0.18); // 18% GST
  const totalWithGST = subtotal + gstAmount;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${receiptData.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 800px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e40af 0%, #f97316 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold;">PAYMENT RECEIPT</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your payment!</p>
    </div>

    <!-- Receipt Details -->
    <div style="padding: 30px;">
      
      <!-- Company & Customer Info -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 300px; margin-right: 20px;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">From:</h3>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316;">
            <p style="margin: 0; font-weight: bold; font-size: 16px; color: #1e40af;">${receiptData.companyDetails.name}</p>
            <p style="margin: 5px 0; color: #64748b; line-height: 1.5;">${receiptData.companyDetails.address}</p>
            <p style="margin: 5px 0; color: #64748b;">Phone: ${receiptData.companyDetails.phone}</p>
            <p style="margin: 5px 0; color: #64748b;">Email: ${receiptData.companyDetails.email}</p>
            <p style="margin: 5px 0; color: #64748b;">Website: ${receiptData.companyDetails.website}</p>
            ${receiptData.companyDetails.gst ? `<p style="margin: 5px 0; color: #64748b;">GST: ${receiptData.companyDetails.gst}</p>` : ''}
          </div>
        </div>
        
        <div style="flex: 1; min-width: 300px;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">To:</h3>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-weight: bold; font-size: 16px; color: #92400e;">${receiptData.customerName}</p>
            <p style="margin: 5px 0; color: #a16207;">Email: ${receiptData.customerEmail}</p>
            <p style="margin: 5px 0; color: #a16207;">Phone: ${receiptData.customerPhone}</p>
            <p style="margin: 5px 0; color: #a16207; line-height: 1.5;">Address: ${receiptData.shippingAddress}</p>
          </div>
        </div>
      </div>

      <!-- Receipt Metadata -->
      <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div>
            <p style="margin: 0; color: #1e40af; font-weight: bold;">Receipt Number:</p>
            <p style="margin: 5px 0 0 0; color: #1e3a8a; font-family: monospace; font-size: 16px;">${receiptData.orderNumber}</p>
          </div>
          <div>
            <p style="margin: 0; color: #1e40af; font-weight: bold;">Payment ID:</p>
            <p style="margin: 5px 0 0 0; color: #1e3a8a; font-family: monospace; font-size: 14px;">${receiptData.paymentId}</p>
          </div>
          <div>
            <p style="margin: 0; color: #1e40af; font-weight: bold;">Transaction Date:</p>
            <p style="margin: 5px 0 0 0; color: #1e3a8a;">${receiptData.transactionDate}</p>
          </div>
          <div>
            <p style="margin: 0; color: #1e40af; font-weight: bold;">Payment Status:</p>
            <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${receiptData.paymentStatus}</span>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e40af; margin: 0 0 20px 0; font-size: 18px;">Items Purchased:</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 15px; text-align: left; color: #374151; font-weight: 600;">Item Description</th>
                <th style="padding: 15px; text-align: center; color: #374151; font-weight: 600;">Qty</th>
                <th style="padding: 15px; text-align: right; color: #374151; font-weight: 600;">Unit Price</th>
                <th style="padding: 15px; text-align: right; color: #374151; font-weight: 600;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payment Summary -->
      <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h3 style="color: #1e40af; margin: 0 0 20px 0; font-size: 18px;">Payment Summary:</h3>
        <div style="space-y: 10px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #64748b;">Subtotal:</span>
            <span style="color: #1f2937; font-weight: 500;">₹${subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #64748b;">GST (18%):</span>
            <span style="color: #1f2937; font-weight: 500;">₹${gstAmount.toLocaleString('en-IN')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #1e40af; margin-top: 10px;">
            <span style="color: #1e40af; font-weight: bold; font-size: 18px;">Total Paid:</span>
            <span style="color: #f97316; font-weight: bold; font-size: 20px;">₹${receiptData.amount.toLocaleString('en-IN')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="color: #64748b;">Payment Method:</span>
            <span style="color: #1f2937; font-weight: 500; text-transform: capitalize;">${receiptData.paymentMethod.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      <!-- Important Notes -->
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-top: 30px;">
        <h4 style="color: #dc2626; margin: 0 0 15px 0; font-size: 16px;">Important Notes:</h4>
        <ul style="color: #7f1d1d; margin: 0; padding-left: 20px; line-height: 1.6;">
          <li>This is a computer-generated receipt and does not require a physical signature.</li>
          <li>Please keep this receipt for your records and warranty claims.</li>
          <li>For any queries regarding this payment, please contact us with the Receipt Number.</li>
          <li>This receipt serves as proof of payment for your order.</li>
        </ul>
      </div>

      <!-- Contact Information -->
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #64748b; margin: 0;">Questions about this receipt? Contact us:</p>
        <p style="color: #1e40af; margin: 10px 0; font-weight: 500;">
          📧 ${receiptData.companyDetails.email} | 📞 ${receiptData.companyDetails.phone}
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #374151; color: #d1d5db; text-align: center; padding: 20px;">
      <p style="margin: 0; font-size: 14px;">
        Thank you for choosing ${receiptData.companyDetails.name}!
      </p>
      <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">
        This receipt was generated automatically on ${receiptData.transactionDate}
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

export function generateReceiptText(receiptData: ReceiptData): string {
  const itemsList = receiptData.items.map(item => {
    const itemPrice = parseInt(item.build.price) || 0;
    const itemTotal = itemPrice * item.quantity;
    return `- ${item.build.name} (Qty: ${item.quantity}) - ₹${itemTotal.toLocaleString('en-IN')}`;
  }).join('\n');

  return `
PAYMENT RECEIPT
===============

Receipt Number: ${receiptData.orderNumber}
Payment ID: ${receiptData.paymentId}
Transaction Date: ${receiptData.transactionDate}
Payment Status: ${receiptData.paymentStatus}

FROM:
${receiptData.companyDetails.name}
${receiptData.companyDetails.address}
Phone: ${receiptData.companyDetails.phone}
Email: ${receiptData.companyDetails.email}

TO:
${receiptData.customerName}
Email: ${receiptData.customerEmail}
Phone: ${receiptData.customerPhone}
Address: ${receiptData.shippingAddress}

ITEMS PURCHASED:
${itemsList}

PAYMENT SUMMARY:
Subtotal: ₹${receiptData.amount.toLocaleString('en-IN')}
Payment Method: ${receiptData.paymentMethod.replace('_', ' ')}
Total Paid: ₹${receiptData.amount.toLocaleString('en-IN')}

Thank you for your payment!

For any queries, contact us at ${receiptData.companyDetails.email}
  `.trim();
}

export async function sendAutomatedReceipt(receiptData: ReceiptData): Promise<boolean> {
  try {
    console.log(`📧 Sending receipt via Brevo to: ${receiptData.customerEmail}`);
    
    // Generate dark-themed receipt using FusionForge template
    const { generateFusionForgeReceiptHTML } = await import('./fusionforge-receipt-template');
    const receiptHtml = generateFusionForgeReceiptHTML(receiptData);
    
    // Send email directly using nodemailer with Brevo SMTP
    const nodemailer = (await import('nodemailer')).default;
    
    const brevoUser = process.env.BREVO_SMTP_USER;
    const brevoPass = process.env.BREVO_SMTP_PASS;
    
    if (!brevoUser || !brevoPass) {
      throw new Error('Missing Brevo SMTP credentials. Please set BREVO_SMTP_USER and BREVO_SMTP_PASS environment variables.');
    }
    
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: brevoUser,
        pass: brevoPass
      }
    });

    const mailOptions = {
      from: process.env.BUSINESS_EMAIL || 'fusionforgepcs@gmail.com',
      to: receiptData.customerEmail,
      subject: `Receipt #${receiptData.orderNumber} - FusionForge PCs`,
      html: receiptHtml,
      text: generateReceiptText(receiptData)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully via Brevo SMTP to:', receiptData.customerEmail);
    console.log('Message ID:', info.messageId);
    console.log(`✅ Receipt delivered via Brevo to: ${receiptData.customerEmail}`);
    
    return true;
  } catch (error: any) {
    console.error('Receipt email delivery failed:', error.message);
    console.log(`❌ Failed to deliver receipt via Brevo to: ${receiptData.customerEmail}`);
    return false;
  }
}