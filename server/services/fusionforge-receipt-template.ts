import { ReceiptData } from './receipt-generator';

export function generateFusionForgeReceiptHTML(receiptData: ReceiptData): string {
  // Calculate pricing breakdown - use proper forward calculation
  const subtotal = receiptData.amount;
  const gstAmount = Math.round(subtotal * 0.18);
  const totalWithGST = subtotal + gstAmount;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - FusionForge PCs</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #0f0f1e;
            color: #ffffff;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1e293b, #0f172a);
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        }
        .header {
            background: linear-gradient(135deg, #ff5722, #ffa726);
            padding: 25px;
            text-align: center;
            margin-bottom: 30px;
            border-radius: 12px;
        }
        .header h1 {
            color: white;
            margin: 0;
            font-size: 32px;
            font-weight: bold;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            color: rgba(255,255,255,0.9);
            margin: 8px 0 0 0;
            font-size: 16px;
        }
        .section-title {
            color: #ffffff;
            margin-bottom: 15px;
            font-size: 22px;
            font-weight: bold;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 30px;
        }
        .info-item {
            color: #e0e0e0;
            margin: 8px 0;
            font-size: 16px;
        }
        .info-label {
            color: #ffffff;
            font-weight: bold;
        }
        .status-paid {
            color: #4caf50;
            font-weight: bold;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: rgba(255, 87, 34, 0.05);
            border-radius: 8px;
            overflow: hidden;
        }
        .table-header {
            background: rgba(255, 87, 34, 0.2);
        }
        .table-header th {
            padding: 15px;
            color: #ffa726;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            border-bottom: 2px solid #ff5722;
        }
        .table-row td {
            padding: 20px 15px;
            border-bottom: 1px solid #333;
            vertical-align: top;
        }
        .item-name {
            color: #ffffff;
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 8px;
        }
        .item-description {
            color: #e0e0e0;
            font-size: 14px;
            margin-bottom: 12px;
        }
        .component-item {
            background: rgba(255, 167, 38, 0.1);
            padding: 10px;
            border-radius: 6px;
            margin: 6px 0;
        }
        .component-type {
            color: #ffa726;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
        }
        .component-name {
            color: #ffffff;
            font-size: 14px;
            margin: 4px 0;
            font-weight: 500;
        }
        .component-spec {
            color: #e0e0e0;
            font-size: 12px;
        }
        .quantity-cell {
            text-align: center;
            color: #ffffff;
            font-size: 20px;
            font-weight: bold;
        }
        .price-cell {
            text-align: right;
            color: #ffffff;
            font-size: 18px;
            font-weight: bold;
        }
        .total-cell {
            text-align: right;
            color: #ffa726;
            font-size: 22px;
            font-weight: bold;
        }
        .summary-section {
            text-align: right;
            margin-top: 30px;
        }
        .summary-box {
            display: inline-block;
            background: rgba(255, 87, 34, 0.1);
            padding: 25px;
            border-radius: 10px;
            border: 2px solid #ff5722;
        }
        .summary-line {
            color: #e0e0e0;
            margin: 10px 0;
            font-size: 18px;
        }
        .summary-label {
            color: #ffffff;
            font-weight: bold;
        }
        .summary-value {
            color: #ffffff;
            font-weight: bold;
        }
        .grand-total {
            border-top: 2px solid #ff5722;
            margin: 15px 0 0 0;
            padding-top: 15px;
        }
        .grand-total-text {
            color: #ffa726;
            font-size: 26px;
            font-weight: bold;
            margin: 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 25px;
            background: rgba(255, 87, 34, 0.05);
            border-radius: 10px;
        }
        .footer-message {
            color: #e0e0e0;
            font-size: 18px;
            font-weight: bold;
            margin: 12px 0;
        }
        .footer-website {
            color: #ffa726;
            font-size: 16px;
            font-weight: bold;
            margin: 12px 0;
        }
        .footer-terms {
            color: #b0b0b0;
            font-size: 13px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <svg width="60" height="60" viewBox="0 0 200 200" style="margin-bottom: 15px;">
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="95" fill="url(#logoGradient)" stroke="#ffffff" stroke-width="3"/>
                <path d="M60 80 L140 80 L100 120 Z" fill="#ffffff" opacity="0.9"/>
                <path d="M70 120 L130 120 L100 160 Z" fill="#ffffff" opacity="0.7"/>
                <circle cx="100" cy="60" r="15" fill="#ffffff"/>
            </svg>
            <h1>Fusion Forge PCs</h1>
            <p>Custom Gaming & Workstation Computers</p>
            <p>${receiptData.companyDetails.email}</p>
        </div>

        <h2 class="section-title">Invoice Details</h2>
        <div class="info-grid">
            <div>
                <div class="info-item"><span class="info-label">Order Number:</span> ${receiptData.orderNumber}</div>
                <div class="info-item"><span class="info-label">Payment ID:</span> ${receiptData.paymentId}</div>
                <div class="info-item"><span class="info-label">Date:</span> ${receiptData.transactionDate}</div>
            </div>
            <div>
                <div class="info-item"><span class="info-label">Payment Method:</span> ${receiptData.paymentMethod}</div>
                <div class="info-item"><span class="info-label">Status:</span> <span class="status-paid">${receiptData.paymentStatus}</span></div>
            </div>
        </div>

        <h2 class="section-title">Billing To</h2>
        <div style="margin-bottom: 30px;">
            <div class="info-item"><span class="info-label">Name:</span> ${receiptData.customerName}</div>
            <div class="info-item"><span class="info-label">Email:</span> <a href="mailto:${receiptData.customerEmail}" style="color: #ffa726; text-decoration: none;">${receiptData.customerEmail}</a></div>
            <div class="info-item"><span class="info-label">Phone:</span> ${receiptData.customerPhone}</div>
            <div class="info-item"><span class="info-label">Address:</span> ${receiptData.shippingAddress}</div>
        </div>

        <table class="items-table">
            <thead class="table-header">
                <tr>
                    <th style="text-align: left;">ITEM DESCRIPTION</th>
                    <th style="text-align: center;">QUANTITY</th>
                    <th style="text-align: right;">UNIT PRICE</th>
                    <th style="text-align: right;">TOTAL PRICE</th>
                </tr>
            </thead>
            <tbody>
                ${receiptData.items.map(item => `
                    <tr class="table-row">
                        <td>
                            <div class="item-name">${item.build.name}</div>
                            <div class="item-description">${(item.build as any).description || 'Custom PC Build'}</div>
                            ${item.build.components && item.build.components.length > 0 ? `
                                <div style="margin-top: 12px;">
                                    ${item.build.components.map(component => `
                                        <div class="component-item">
                                            <div class="component-type">${component.type.toUpperCase()}</div>
                                            <div class="component-name">${component.name}</div>
                                            <div class="component-spec">${component.specification}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </td>
                        <td class="quantity-cell">${item.quantity}</td>
                        <td class="price-cell">₹${(parseInt((item.build as any).price || '0')).toLocaleString('en-IN')}</td>
                        <td class="total-cell">₹${(parseInt((item.build as any).price || '0') * item.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="summary-section">
            <div class="summary-box">
                <div class="summary-line">
                    <span class="summary-label">Subtotal:</span> 
                    <span class="summary-value">₹${subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-line">
                    <span class="summary-label">GST (18%):</span> 
                    <span class="summary-value">₹${gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div class="grand-total">
                    <p class="grand-total-text">Grand Total: ₹${totalWithGST.toLocaleString('en-IN')}</p>
                </div>
            </div>
        </div>

        <div class="footer">
            <p class="footer-message">Thank you for choosing FusionForge PCs!</p>
            <p class="footer-terms">Terms and Conditions: Please keep this invoice for warranty claims.</p>
        </div>
    </div>
</body>
</html>
  `;
}