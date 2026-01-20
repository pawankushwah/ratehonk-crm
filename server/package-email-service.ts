import { simpleStorage } from "./simple-storage";
import { TenantEmailService } from "./tenant-email-service";

const tenantEmailService = new TenantEmailService();

interface PackageRecipient {
  name: string;
  email: string;
}

interface SendPackageEmailOptions {
  tenantId: number;
  package: any;
  recipient: PackageRecipient;
  companyName: string;
  publicUrl: string;
  customMessage?: string;
}

// Generate PDF for package
async function generatePackagePDF(pkg: any, tenant: any): Promise<Buffer | null> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const pdfHtml = generatePackageHTML(pkg, tenant);

    await page.setContent(pdfHtml, { waitUntil: 'networkidle' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });

    await browser.close();
    console.log(`✅ PDF generated successfully for package ${pkg.name}`);
    return pdfBuffer;
  } catch (error: any) {
    console.error("⚠️ Failed to generate PDF:", error);
    return null;
  }
}

// Generate HTML for package PDF
function generatePackageHTML(pkg: any, tenant: any): string {
  const companyName = tenant?.company_name || tenant?.name || "RateHonk";
  const companyEmail = tenant?.email || "";
  const companyPhone = tenant?.phone || "";
  const companyAddress = tenant?.address || "";

  const inclusions = Array.isArray(pkg.inclusions) ? pkg.inclusions : [];
  const exclusions = Array.isArray(pkg.exclusions) ? pkg.exclusions : [];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${pkg.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .package-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: white;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #0BBCD6;
    }
    
    .company-info h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .company-info p {
      color: #6b7280;
      margin-bottom: 4px;
      font-size: 12px;
    }
    
    .package-title {
      text-align: right;
    }
    
    .package-title h2 {
      font-size: 32px;
      font-weight: 700;
      color: #0BBCD6;
      margin-bottom: 8px;
    }
    
    .package-image {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    
    .package-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .detail-card {
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #0BBCD6;
    }
    
    .detail-card h3 {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .detail-card p {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
    }
    
    .description {
      margin: 30px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .description h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
    }
    
    .description p {
      color: #4b5563;
      line-height: 1.8;
    }
    
    .lists-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin: 30px 0;
    }
    
    .list-box {
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .list-box h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
    }
    
    .list-box ul {
      list-style: none;
      padding: 0;
    }
    
    .list-box li {
      padding: 8px 0;
      color: #4b5563;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .list-box li:last-child {
      border-bottom: none;
    }
    
    .list-box li:before {
      content: "✓ ";
      color: #10b981;
      font-weight: 600;
      margin-right: 8px;
    }
    
    .exclusions li:before {
      content: "✗ ";
      color: #ef4444;
    }
    
    .price-section {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: linear-gradient(135deg, #0BBCD6 0%, #00BFFF 100%);
      border-radius: 12px;
      color: white;
    }
    
    .price-label {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    
    .price-amount {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .price-note {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="package-container">
    <div class="header">
      <div class="company-info">
        <h1>${companyName}</h1>
        ${companyEmail ? `<p>${companyEmail}</p>` : ''}
        ${companyPhone ? `<p>${companyPhone}</p>` : ''}
        ${companyAddress ? `<p>${companyAddress}</p>` : ''}
      </div>
      <div class="package-title">
        <h2>${pkg.name}</h2>
        ${pkg.altName ? `<p style="color: #6b7280; font-size: 14px;">${pkg.altName}</p>` : ''}
      </div>
    </div>

    ${pkg.packageStayingImage || pkg.image ? `
    <img src="${pkg.packageStayingImage || pkg.image}" alt="${pkg.name}" class="package-image" />
    ` : ''}

    <div class="package-details">
      <div class="detail-card">
        <h3>Destination</h3>
        <p>${pkg.destination || 'N/A'}</p>
      </div>
      <div class="detail-card">
        <h3>Duration</h3>
        <p>${pkg.duration || 0} ${pkg.durationType === 'with' ? 'Days' : 'Days'}</p>
      </div>
      <div class="detail-card">
        <h3>Max Capacity</h3>
        <p>${pkg.maxCapacity || 0} Travelers</p>
      </div>
      ${pkg.rating ? `
      <div class="detail-card">
        <h3>Rating</h3>
        <p>${pkg.rating}/5 ⭐</p>
      </div>
      ` : ''}
    </div>

    ${pkg.description ? `
    <div class="description">
      <h3>About This Package</h3>
      <p>${pkg.description}</p>
    </div>
    ` : ''}

    ${(inclusions.length > 0 || exclusions.length > 0) ? `
    <div class="lists-section">
      ${inclusions.length > 0 ? `
      <div class="list-box">
        <h3>What's Included</h3>
        <ul>
          ${inclusions.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      ${exclusions.length > 0 ? `
      <div class="list-box exclusions">
        <h3>What's Not Included</h3>
        <ul>
          ${exclusions.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
    ` : ''}

    <div class="price-section">
      <div class="price-label">Starting From</div>
      <div class="price-amount">$${parseFloat(pkg.price || 0).toFixed(2)}</div>
      <div class="price-note">Per person</div>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      <p>For bookings and inquiries, please contact us at ${companyEmail || 'our support team'}.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Send package email
export async function sendPackageEmail(options: SendPackageEmailOptions): Promise<boolean> {
  try {
    const { tenantId, package: pkg, recipient, companyName, publicUrl, customMessage } = options;

    // Get tenant details
    const tenant = await simpleStorage.getTenant(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Generate PDF
    const pdfBuffer = await generatePackagePDF(pkg, tenant);

    // Generate email HTML
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pkg.name} - Travel Package</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f5f7fa;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #0BBCD6 0%, #00BFFF 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0BBCD6 0%, #00BFFF 100%); padding: 40px 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <div style="width: 50px; height: 50px; background-color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">✈️</div>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${pkg.name}</h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hello <strong style="color: #111827;">${recipient.name}</strong>,
              </p>
              
              ${customMessage ? `
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${customMessage}
              </p>
              ` : ''}
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We're excited to share this amazing travel package with you! Check out the details below:
              </p>

              <!-- Package Image -->
              ${pkg.packageStayingImage || pkg.image ? `
              <div style="margin: 24px 0; text-align: center;">
                <img src="${pkg.packageStayingImage || pkg.image}" alt="${pkg.name}" style="max-width: 100%; height: auto; border-radius: 12px;" />
              </div>
              ` : ''}

              <!-- Package Details -->
              <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
                  <div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Destination</div>
                    <div style="font-size: 18px; font-weight: 700; color: #1f2937;">${pkg.destination || 'N/A'}</div>
                  </div>
                  <div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Duration</div>
                    <div style="font-size: 18px; font-weight: 700; color: #1f2937;">${pkg.duration || 0} Days</div>
                  </div>
                </div>
                <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                  <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">Starting From</div>
                  <div style="font-size: 32px; font-weight: 700; color: #0BBCD6;">$${parseFloat(pkg.price || 0).toFixed(2)}</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Per person</div>
                </div>
              </div>

              ${pkg.description ? `
              <div style="margin: 24px 0;">
                <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">About This Package</h3>
                <p style="color: #4b5563; line-height: 1.8;">${pkg.description}</p>
              </div>
              ` : ''}

              <!-- View Package Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <a href="${publicUrl}" style="display: inline-block; background: linear-gradient(135deg, #0BBCD6 0%, #00BFFF 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 4px 14px 0 rgba(11, 188, 214, 0.39);">
                      View Package & Book Now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center;">
                Or copy and paste this link into your browser:<br>
                <a href="${publicUrl}" style="color: #0BBCD6; word-break: break-all; text-decoration: underline;">${publicUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 8px; color: #374151; font-size: 14px; font-weight: 600;">
                Best regards,<br>
                The ${companyName} Team
              </p>
              <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                Package details are attached as PDF for your reference.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email using tenant email service
    const emailSent = await tenantEmailService.sendPackageEmail({
      tenantId,
      to: recipient.email,
      recipientName: recipient.name,
      package: pkg,
      companyName,
      publicUrl,
      customMessage: customMessage || "",
      htmlBody: emailHtml,
      pdfBuffer,
    });

    return emailSent;
  } catch (error: any) {
    console.error("Error sending package email:", error);
    return false;
  }
}
