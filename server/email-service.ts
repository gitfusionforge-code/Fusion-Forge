import { sendEmailViaBrevo } from './services/brevo-email-service';

interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Use Brevo email service
    const success = await sendEmailViaBrevo(emailData);
    return success;
  } catch (error: any) {
    return false;
  }
}

export function createQuoteRequestEmail(inquiry: any) {
  const subject = `New FusionForge PC Build Quote Request from ${inquiry.name}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1e3a8a; margin: 0; font-size: 32px; font-weight: bold;">FusionForge PCs</h1>
        <p style="color: #64748b; margin: 5px 0; font-size: 16px;">Forge Your Power</p>
      </div>
      <h2 style="color: #1e3a8a; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
        New FusionForge PC Build Quote Request
      </h2>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e3a8a; margin-top: 0;">Customer Information</h3>
        <p><strong>Name:</strong> ${inquiry.name}</p>
        <p><strong>Email:</strong> ${inquiry.email}</p>
        <p><strong>Budget Range:</strong> ${inquiry.budget}</p>
        <p><strong>Primary Use Case:</strong> ${inquiry.useCase}</p>
      </div>
      
      <div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="color: #1e3a8a; margin-top: 0;">Project Details</h3>
        <p style="line-height: 1.6;">${inquiry.details}</p>
      </div>
      
      <div style="margin-top: 30px; padding: 15px; background: #fee2e2; border-radius: 8px; border-left: 4px solid #dc2626;">
        <p style="margin: 0; color: #dc2626; font-weight: bold;">
          Please respond to this customer within 24 hours for the best conversion rate.
        </p>
      </div>
      
      <div style="margin-top: 30px; text-align: center; color: #64748b; font-size: 14px;">
        <p>This email was sent from your FusionForge PCs website contact form.</p>
        <p>Submitted on: ${new Date().toLocaleString()}</p>
      </div>
    </div>
  `;
  
  const text = `
    New FusionForge PC Build Quote Request
    
    Customer: ${inquiry.name}
    Email: ${inquiry.email}
    Budget: ${inquiry.budget}
    Use Case: ${inquiry.useCase}
    
    Details:
    ${inquiry.details}
    
    Submitted on: ${new Date().toLocaleString()}
  `;
  
  return { subject, html, text };
}

export function createInquiryResponseEmail(inquiry: any) {
  const subject = `FusionForge PCs - Your Custom PC Build Quote is Ready! - ${inquiry.name}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1e3a8a; margin: 0;">FusionForge PCs</h1>
        <p style="color: #64748b; margin: 5px 0;">Forge Your Power</p>
      </div>
      
      <h2 style="color: #1e3a8a;">Your Custom PC Build Quote is Ready!</h2>
      
      <p>Hi ${inquiry.name},</p>
      
      <p>Thank you for your interest in FusionForge PCs! Our team has carefully reviewed your requirements and prepared a custom PC build quote tailored specifically for your needs.</p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e3a8a; margin-top: 0;">Your Requirements</h3>
        <p><strong>Budget Range:</strong> ${inquiry.budget}</p>
        <p><strong>Primary Use Case:</strong> ${inquiry.useCase}</p>
        <p><strong>Requirements:</strong> ${inquiry.requirements}</p>
      </div>
      
      <div style="background: #dcfdf7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #059669; margin-top: 0;">Your Custom Quote</h3>
        <p>Based on your requirements, we've designed a high-performance PC build that delivers exceptional value within your budget. Our quote includes:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Premium quality components from trusted brands</li>
          <li>Professional assembly and cable management</li>
          <li>Comprehensive stress testing and quality assurance</li>
          <li>1-year warranty on the complete build</li>
          <li>Free installation support and setup assistance</li>
        </ul>
      </div>
      
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e;">
          <strong>Ready to proceed?</strong> Reply to this email or call us at ${process.env.BUSINESS_PHONE || '+91 9363599577'} to discuss your quote and place your order.
        </p>
      </div>
      
      <div style="margin-top: 30px; text-align: center;">
        <p>We're excited to build your dream PC!</p>
        <p style="color: #64748b; font-size: 14px;">
          This quote is valid for 30 days. Contact us if you have any questions or modifications.
        </p>
      </div>
    </div>
  `;
  
  const text = `
    FusionForge PCs - Your Custom PC Build Quote is Ready!
    
    Hi ${inquiry.name},
    
    Thank you for your interest in FusionForge PCs! Our team has carefully reviewed your requirements and prepared a custom PC build quote tailored specifically for your needs.
    
    Your Requirements:
    - Budget Range: ${inquiry.budget}
    - Primary Use Case: ${inquiry.useCase}
    - Requirements: ${inquiry.requirements}
    
    Based on your requirements, we've designed a high-performance PC build that delivers exceptional value within your budget.
    
    Ready to proceed? Reply to this email or call us at ${process.env.BUSINESS_PHONE || '+91 9363599577'} to discuss your quote and place your order.
    
    We're excited to build your dream PC!
    
    This quote is valid for 30 days. Contact us if you have any questions or modifications.
  `;
  
  return { subject, html, text };
}

export function createCustomerConfirmationEmail(inquiry: any) {
  const subject = `FusionForge PCs - We received your custom build quote request - ${inquiry.name}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <svg width="60" height="60" viewBox="0 0 200 200" style="margin-bottom: 15px;">
          <defs>
            <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="95" fill="url(#logoGradient2)" stroke="#ffffff" stroke-width="3"/>
          <path d="M60 80 L140 80 L100 120 Z" fill="#ffffff" opacity="0.9"/>
          <path d="M70 120 L130 120 L100 160 Z" fill="#ffffff" opacity="0.7"/>
          <circle cx="100" cy="60" r="15" fill="#ffffff"/>
        </svg>
        <h1 style="color: #1e3a8a; margin: 0;">FusionForge PCs</h1>
        <p style="color: #64748b; margin: 5px 0;">Forge Your Power</p>
      </div>
      
      <h2 style="color: #1e3a8a;">Thank you for your quote request!</h2>
      
      <p>Hi ${inquiry.name},</p>
      
      <p>We've received your custom PC build quote request and our team is already reviewing your requirements. Here's a summary of what you submitted:</p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Budget Range:</strong> ${inquiry.budget}</p>
        <p><strong>Primary Use:</strong> ${inquiry.useCase}</p>
        <p><strong>Special Requirements:</strong></p>
        <p style="font-style: italic; color: #64748b;">"${inquiry.details}"</p>
      </div>
      
      <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e3a8a; margin-top: 0;">What happens next?</h3>
        <ul style="line-height: 1.8;">
          <li>Our PC experts will analyze your requirements within 24 hours</li>
          <li>We'll create a custom build configuration that fits your budget</li>
          <li>You'll receive a detailed quote with component specifications</li>
          <li>We'll schedule a consultation call to discuss your build</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="mailto:${process.env.BUSINESS_EMAIL || 'fusionforgepcs@gmail.com'}" 
           style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Contact Us Directly
        </a>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #64748b; font-size: 14px;">
        <p>Questions? Reply to this email or call us at +91 9363599577</p>
        <p>FusionForge PCs - Where Innovation Meets Performance</p>
      </div>
    </div>
  `;
  
  return { subject, html };
}

export function createOrderConfirmationEmail(orderData: any) {
  const orderNumber = orderData.orderNumber || `FF${Date.now().toString().slice(-8)}`;
  const orderDate = new Date().toLocaleDateString();
  
  const subject = `Order Confirmation - ${orderNumber} - FusionForge PCs`;
  
  const itemsHtml = orderData.items.map((item: any) => {
    const price = item.build.basePrice || item.build.totalPrice || item.build.price || 0;
    return `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 15px 0;">
        <div style="font-weight: bold; color: #1e3a8a;">${item.build.name}</div>
        <div style="font-size: 14px; color: #64748b;">${item.build.category} PC Build</div>
      </td>
      <td style="padding: 15px 0; text-align: center;">Qty: ${item.quantity}</td>
      <td style="padding: 15px 0; text-align: right; font-weight: bold;">₹${price.toLocaleString('en-IN')}</td>
    </tr>`;
  }).join('');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f97316;">
        <svg width="60" height="60" viewBox="0 0 200 200" style="margin-bottom: 15px;">
          <defs>
            <linearGradient id="logoGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="95" fill="url(#logoGradient3)" stroke="#ffffff" stroke-width="3"/>
          <path d="M60 80 L140 80 L100 120 Z" fill="#ffffff" opacity="0.9"/>
          <path d="M70 120 L130 120 L100 160 Z" fill="#ffffff" opacity="0.7"/>
          <circle cx="100" cy="60" r="15" fill="#ffffff"/>
        </svg>
        <h1 style="color: #1e3a8a; margin: 0; font-size: 28px;">FusionForge PCs</h1>
        <p style="color: #64748b; margin: 5px 0; font-size: 16px;">Where Innovation Meets Performance</p>
      </div>
      
      <!-- Success Message -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #10b981; color: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 24px;">✓</div>
        <h2 style="color: #1e3a8a; margin: 0; font-size: 24px;">Order Placed Successfully!</h2>
        <p style="color: #64748b; margin: 10px 0;">Thank you for choosing FusionForge PCs</p>
      </div>
      
      <!-- Order Details -->
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e3a8a; margin-top: 0;">Order Information</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        <p><strong>Customer:</strong> ${orderData.fullName}</p>
        <p><strong>Email:</strong> ${orderData.email}</p>
        <p><strong>Phone:</strong> ${orderData.phone}</p>
      </div>
      
      <!-- Shipping Address -->
      <div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e3a8a; margin-top: 0;">Shipping Address</h3>
        <p>${orderData.address}<br>
        ${orderData.city}, ${orderData.zipCode}</p>
      </div>
      
      <!-- Order Items -->
      <div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e3a8a; margin-top: 0;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
          <tr style="border-top: 2px solid #1e3a8a;">
            <td colspan="2" style="padding: 15px 0; font-size: 18px; font-weight: bold; color: #1e3a8a;">Total Amount</td>
            <td style="padding: 15px 0; text-align: right; font-size: 18px; font-weight: bold; color: #f97316;">₹${orderData.totalPrice.toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </div>
      
      <!-- Payment Method -->
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Payment Method:</strong> ${orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}</p>
      </div>
      
      <!-- Next Steps -->
      <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1e3a8a; margin-top: 0;">What happens next?</h3>
        <ul style="line-height: 1.8; color: #1e40af;">
          <li>Our team will call you within 24 hours to confirm specifications and pricing</li>
          <li>We'll begin sourcing and assembling your custom PC</li>
          <li>Quality testing and delivery coordination</li>
          <li>You'll receive tracking information once shipped</li>
        </ul>
      </div>
      
      ${orderData.notes ? `
      <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #1e3a8a; margin-top: 0;">Your Notes:</h4>
        <p style="font-style: italic; color: #64748b; margin: 0;">"${orderData.notes}"</p>
      </div>
      ` : ''}
      
      <!-- Support Section -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="mailto:${process.env.BUSINESS_EMAIL || 'fusionforgepcs@gmail.com'}" 
           style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
          Contact Support
        </a>
        <a href="tel:+91 9363599577" 
           style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Call Us
        </a>
      </div>
      
      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #64748b; font-size: 14px;">
        <p>Need immediate assistance? Call us at +91 9363599577</p>
        <p>Order placed on ${orderDate}</p>
        <p style="margin-top: 15px; font-weight: bold;">FusionForge PCs - Forge Your Power</p>
      </div>
    </div>
  `;
  
  const text = `
    FusionForge PCs - Order Confirmation
    
    Order Number: ${orderNumber}
    Order Date: ${orderDate}
    
    Customer: ${orderData.fullName}
    Email: ${orderData.email}
    Phone: ${orderData.phone}
    
    Shipping Address:
    ${orderData.address}
    ${orderData.city}, ${orderData.zipCode}
    
    Order Items:
    ${orderData.items.map((item: any) => {
      const price = item.build.basePrice || item.build.totalPrice || 0;
      return `- ${item.build.name} (Qty: ${item.quantity}) - ₹${price.toLocaleString('en-IN')}`;
    }).join('\n')}
    
    Total: ₹${orderData.totalPrice.toLocaleString('en-IN')}
    Payment: ${orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}
    
    ${orderData.notes ? `Notes: ${orderData.notes}` : ''}
    
    What's next:
    - Our team will call you within 24 hours to confirm details
    - We'll begin sourcing and assembling your custom PC
    - You'll receive tracking information once shipped
    
    Questions? Contact us at ${process.env.BUSINESS_EMAIL || 'fusionforgepcs@gmail.com'} or +91 9363599577
  `;
  
  return { subject, html, text, orderNumber };
}