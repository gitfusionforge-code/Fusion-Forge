import { ReceiptData } from './receipt-generator';
import { generateFusionForgeReceiptHTML } from './fusionforge-receipt-template';

export function generateProfessionalInvoiceHTML(receiptData: ReceiptData): string {
  return generateFusionForgeReceiptHTML(receiptData);
}

export async function sendProfessionalInvoice(receiptData: ReceiptData): Promise<boolean> {
  try {
    console.log(`📧 Sending professional invoice via Brevo to: ${receiptData.customerEmail}`);
    
    const { sendEmailViaBrevo } = await import('./brevo-email-service');
    
    const invoiceHtml = generateFusionForgeReceiptHTML(receiptData);
    
    const success = await sendEmailViaBrevo({
      to: receiptData.customerEmail,
      from: `"FusionForge PCs" <${process.env.BUSINESS_EMAIL || 'contact@company.com'}>`,
      subject: `Invoice #${receiptData.orderNumber} - FusionForge PCs`,
      html: invoiceHtml,
      text: `Invoice #${receiptData.orderNumber} for ₹${receiptData.amount.toLocaleString('en-IN')}`
    });
    
    if (success) {
      console.log(`✅ Professional invoice sent via Brevo to: ${receiptData.customerEmail}`);
    } else {
      console.log(`❌ Failed to send professional invoice via Brevo to: ${receiptData.customerEmail}`);
    }
    
    return success;
  } catch (error: any) {
    console.error('Professional invoice email failed:', error.message);
    console.log(`❌ Failed to send professional invoice for: ${receiptData.customerEmail}`);
    return false;
  }
}