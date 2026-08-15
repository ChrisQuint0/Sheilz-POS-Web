import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { email, customerName, transaction } = await request.json();

    if (!email || !transaction) {
      return NextResponse.json({ error: 'Email and transaction are required' }, { status: 400 });
    }

    const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
    const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY;
    const MAILJET_FROM_EMAIL = process.env.MAILJET_FROM_EMAIL;

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY || !MAILJET_FROM_EMAIL) {
      return NextResponse.json({ error: 'Mailjet configuration is missing' }, { status: 500 });
    }

    let logoBase64 = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'sheilz_pos_logo.png');
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
    } catch (e) {
      console.warn('Could not read logo file for email:', e);
    }
    const orderDate = format(new Date(transaction.createdAt), 'MM/dd/yyyy HH:mm');
    
    // Generate items HTML
    const itemsHtml = transaction.items.map((item: any) => {
      const details = [item.size, item.temperature].filter(Boolean).join(", ");
      const detailsHtml = details ? `<br><span style="color: #6b7280; font-size: 12px; font-weight: normal;">${details}</span>` : '';
      return `
        <tr>
          <td style="padding: 6px 0; vertical-align: top;">
            <div style="font-family: 'Courier New', Courier, monospace; color: #111827;">
              ${item.name}${detailsHtml}
            </div>
          </td>
          <td style="padding: 6px 12px; text-align: center; vertical-align: top; font-family: 'Courier New', Courier, monospace; color: #111827;">
            ${item.qty}
          </td>
          <td style="padding: 6px 0; text-align: right; vertical-align: top; font-family: 'Courier New', Courier, monospace; color: #111827;">
            ₱${(item.unitPrice * item.qty).toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <div style="background-color: #fcfcfc; padding: 20px; font-family: sans-serif;">
        <div style="max-width: 420px; margin: 0 auto; background-color: #ffffff; border: 1px solid #fce7f3; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden;">
          
          <!-- Header -->
          <div style="padding: 24px; text-align: center; border-bottom: 1px dashed #fbcfe8;">
            <img src="cid:sheilzLogo" alt="Sheilz Coffee" width="64" height="64" style="display: block; margin: 0 auto 12px auto; object-fit: contain;" />
            <h2 style="margin: 0; letter-spacing: 2px; text-transform: uppercase; color: #111827; font-size: 18px;">Sheilz Coffee</h2>
            <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">611 Mercedez Ave, Pasig City</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 24px; font-family: 'Courier New', Courier, monospace; font-size: 14px; color: #111827;">
            
            <!-- Order Details -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <tr>
                <td style="padding-bottom: 4px; color: #6b7280;">Order No:</td>
                <td style="padding-bottom: 4px; text-align: right; font-weight: bold;">#${transaction.orderId}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 4px; color: #6b7280;">Date:</td>
                <td style="padding-bottom: 4px; text-align: right;">${orderDate}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Customer:</td>
                <td style="text-align: right;">${customerName || 'Walk-In'}</td>
              </tr>
            </table>
            
            <div style="border-top: 1px dashed #fbcfe8; margin: 16px 0;"></div>
            
            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <thead>
                <tr>
                  <th style="text-align: left; padding-bottom: 12px; font-size: 12px; letter-spacing: 1px; font-weight: bold;">ITEM</th>
                  <th style="text-align: center; padding-bottom: 12px; font-size: 12px; letter-spacing: 1px; font-weight: bold; padding-left: 12px; padding-right: 12px;">QTY</th>
                  <th style="text-align: right; padding-bottom: 12px; font-size: 12px; letter-spacing: 1px; font-weight: bold;">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="border-top: 1px dashed #fbcfe8; margin: 16px 0;"></div>
            
            <!-- Totals -->
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: bold; font-size: 14px; padding-bottom: 12px;">TOTAL</td>
                <td style="text-align: right; font-weight: bold; font-size: 18px; padding-bottom: 12px;">₱${transaction.amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-size: 13px;">Payment Method:</td>
                <td style="text-align: right; font-size: 13px; font-weight: bold;">${transaction.paymentMethod}</td>
              </tr>
            </table>
            
            <!-- Footer -->
            <div style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 32px;">
              <p style="margin: 0 0 4px;">Thank you for visiting!</p>
              <p style="margin: 0;">Please come again.</p>
            </div>
          </div>
          
        </div>
      </div>
    `;

    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(MAILJET_API_KEY + ':' + MAILJET_SECRET_KEY).toString('base64')
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: MAILJET_FROM_EMAIL,
              Name: "Sheilz Coffee"
            },
            To: [
              {
                Email: email,
                Name: customerName || "Valued Customer"
              }
            ],
            Subject: `Your E-Receipt from Sheilz Coffee (#${transaction.orderId})`,
            HTMLPart: htmlContent,
            InlinedAttachments: logoBase64 ? [
              {
                ContentType: "image/png",
                Filename: "sheilz_pos_logo.png",
                ContentID: "sheilzLogo",
                Base64Content: logoBase64
              }
            ] : undefined
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mailjet API error:', data);
      return NextResponse.json({ error: 'Failed to send email' }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Send receipt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
