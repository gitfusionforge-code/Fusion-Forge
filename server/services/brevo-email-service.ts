import nodemailer from 'nodemailer';

interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmailViaBrevo(emailData: EmailData): Promise<boolean> {
  try {
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

    console.log('📧 Sending email via Brevo SMTP to:', emailData.to);

    const mailOptions = {
      from: process.env.BUSINESS_EMAIL || 'noreply@company.com',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.subject
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully via Brevo SMTP to:', emailData.to);
    console.log('Message ID:', info.messageId);
    
    return true;
  } catch (error: any) {
    console.error('Brevo SMTP error:', error.message);
    return false;
  }
}

export async function sendReceiptViaBrevo(receiptData: any): Promise<boolean> {
  try {
    console.log('📧 Sending receipt via Brevo to:', receiptData.customerEmail);
    
    // Use the unified FusionForge dark-themed template
    const { generateFusionForgeReceiptHTML } = await import('./fusionforge-receipt-template');
    const receiptHtml = generateFusionForgeReceiptHTML(receiptData);
    
    const success = await sendEmailViaBrevo({
      to: receiptData.customerEmail,
      from: `"Your Company" <${process.env.BUSINESS_EMAIL || 'noreply@company.com'}>`,
      subject: `Receipt #${receiptData.orderNumber} - FusionForge PCs`,
      html: receiptHtml,
      text: generateBrevoReceiptText(receiptData)
    });
    
    if (success) {
      console.log('✅ Receipt sent via Brevo to', receiptData.customerEmail);
    }
    
    return success;
  } catch (error: any) {
    console.error('Brevo receipt email failed:', error.message);
    return false;
  }
}

// Removed duplicate template function - now using unified FusionForge template

function generateBrevoReceiptText(receiptData: any): string {
  return `
FusionForge PCs - Invoice #${receiptData.orderNumber}

Customer: ${receiptData.customerName}
Email: ${receiptData.customerEmail}
Phone: ${receiptData.customerPhone}

Order Details:
${receiptData.items.map((item: any) => `- ${item.build.name} x ${item.quantity} - ₹${item.build.basePrice || item.build.price}`).join('\n')}

Total Amount: ₹${receiptData.amount}
Payment Status: ${receiptData.paymentStatus}
Payment ID: ${receiptData.paymentId}

Thank you for choosing FusionForge PCs!
Your custom PC build journey starts here.
  `;
}