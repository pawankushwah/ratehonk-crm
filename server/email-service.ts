// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

function getBaseUrl(): string {
  try {
    let baseUrl = process.env.APP_URL || process.env.FRONTEND_URL || "https://crm.ratehonk.com";
    
    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/$/, "");
    
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV !== "production";
    
    // In development, allow localhost and 127.0.0.1
    if (isDevelopment) {
      // Allow localhost URLs in development
      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1") || baseUrl.includes("0.0.0.0")) {
        if (!baseUrl.startsWith("http")) {
          baseUrl = `http://${baseUrl}`;
        }
        console.log("🔧 Development mode - Using local URL:", baseUrl);
        return baseUrl;
      }
    }
    
    // Force correct domain in production - reject any wrong domains
    if (baseUrl.includes("your-app-url.com") || baseUrl.includes("ww25")) {
      console.log("⚠️ Detected wrong domain in env, overriding to crm.ratehonk.com");
      baseUrl = "https://crm.ratehonk.com";
    }
    
    // Ensure URL is absolute
    if (!baseUrl.startsWith("http")) {
      // Use https for production, http for development
      const protocol = isDevelopment ? "http" : "https";
      baseUrl = `${protocol}://${baseUrl}`;
    }
    
    // In production, ensure it ends with the correct domain
    if (!isDevelopment && !baseUrl.includes("crm.ratehonk.com")) {
      console.log("⚠️ Production mode - Base URL doesn't contain crm.ratehonk.com, forcing correct domain");
      baseUrl = "https://crm.ratehonk.com";
    }
    
    return baseUrl;
  } catch (error) {
    console.error("❌ Error in getBaseUrl():", error);
    // Fallback to localhost in development, production URL otherwise
    const isDevelopment = process.env.NODE_ENV !== "production";
    return isDevelopment ? "http://localhost:5000" : "https://crm.ratehonk.com";
  }
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Get SMTP configuration from environment variables
    const smtpHost = process.env.SMTP_HOST || process.env.MAIL_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587');
    
    // Support both EMAIL_USER/EMAIL_PASS and SMTP_USER/SMTP_PASS for compatibility
    const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER || '';
    const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
    
    // Determine secure setting: 
    // - Port 465 uses direct TLS/SSL (secure: true)
    // - Port 587 uses STARTTLS (secure: false)
    // - Port 25 is typically plain (secure: false)
    // - If SMTP_SECURE env is set, use it, otherwise derive from port
    let secure = false;
    if (process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === 'ssl') {
      secure = true;
    } else if (process.env.SMTP_SECURE === 'false' || process.env.SMTP_SECURE === 'tls' || smtpPort === 587) {
      secure = false; // Port 587 uses STARTTLS
    } else if (smtpPort === 465) {
      secure = true; // Port 465 uses direct TLS/SSL
    }

    console.log("📧 SMTP Configuration:", {
      host: smtpHost,
      port: smtpPort,
      secure: secure,
      user: smtpUser ? `${smtpUser.substring(0, 3)}***` : 'Not set',
      pass: smtpPass ? '***' : 'Not set',
      authMethod: secure ? 'TLS/SSL' : 'STARTTLS'
    });

    if (!smtpUser || !smtpPass) {
      console.warn("⚠️ Warning: SMTP credentials not fully configured. EMAIL_USER/EMAIL_PASS or SMTP_USER/SMTP_PASS must be set.");
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: secure, // true for 465, false for other ports (587 uses STARTTLS)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // Add requireTLS option for port 587 to ensure STARTTLS is used
      requireTLS: !secure && smtpPort === 587,
      tls: {
        // Do not fail on invalid certificates (useful for self-signed certs)
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
      },
    });
  }

  async sendWelcomeEmail(data: {
    to: string;
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
    temporaryPassword: string;
    partnerName?: string;
  }) {
    const loginUrl = process.env.APP_URL || process.env.FRONTEND_URL || "https://crm.ratehonk.com";
    const loginLink = loginUrl.replace(/\/$/, "") + "/login";
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@ratehonk.com",
      to: data.to,
      subject: `Welcome to RateHonk CRM - Your Account Details`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to RateHonk CRM!</h2>
          
          <p>Hello ${data.firstName} ${data.lastName},</p>
          
          <p>Your account has been created for <strong>${data.companyName}</strong> in our RateHonk CRM system.${data.partnerName ? ` Your account was set up by ${data.partnerName}.` : ""}</p>
          
          <p>Here are your login details:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Password:</strong> ${data.temporaryPassword}</p>
          </div>
          
          <p>You can access the system at: <a href="${loginLink}">${loginLink}</a></p>
          
          <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
          
          <p>If you have any questions, please contact your system administrator.</p>
          
          <p>Best regards,<br>The RateHonk Team</p>
        </div>
      `,
    };
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${data.to}`);
    } catch (error) {
      console.error("Error sending welcome email:", error);
      throw error;
    }
  }

  async sendPasswordResetEmail(data: {
    to: string;
    displayName: string;
    resetToken: string;
    companyName: string;
  }) {
    const resetUrl = `${process.env.APP_URL || "https://your-app-url.com"}/reset-password?token=${data.resetToken}`;
    const baseUrl = getBaseUrl();

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@ratehonk.com",
      to: data.to,
      subject: "Reset Your Password - RateHonk",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Password Reset Request</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f5f7fa; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header with Gradient Background -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0BBCD6 0%, #00BFFF 100%); padding: 40px 40px 30px; text-align: center;">
                      <div style="width: 80px; height: 80px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                        <div style="width: 50px; height: 50px; background-color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">🔒</div>
                      </div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Reset Your Password</h1>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                        Hello <strong style="color: #111827;">${data.displayName}</strong>,
                      </p>
                      
                      <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password for your <strong>${data.companyName}</strong> account. Click the button below to create a new password:
                      </p>

                      <!-- Reset Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding: 30px 0;">
                            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0BBCD6 0%, #00BFFF 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 4px 14px 0 rgba(11, 188, 214, 0.39); transition: all 0.3s ease;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Alternative Link -->
                      <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center;">
                        Or copy and paste this link into your browser:<br>
                        <a href="${resetUrl}" style="color: #0BBCD6; word-break: break-all; text-decoration: underline;">${resetUrl}</a>
                      </p>

                      <!-- Security Notice -->
                      <div style="margin: 32px 0 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                          <strong>⏰ Important:</strong> This password reset link will expire in <strong>1 hour</strong> for security purposes. If you don't reset your password within this time, you'll need to request a new link.
                        </p>
                      </div>

                      <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                      <p style="margin: 0 0 8px; color: #374151; font-size: 14px; font-weight: 600;">
                        Best regards,<br>
                        The ${data.companyName} Team
                      </p>
                      <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                        This is an automated email. Please do not reply to this message.<br>
                        If you have any questions, please contact our support team.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Bottom Spacing -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px;">
                  <tr>
                    <td style="padding: 20px 0; text-align: center;">
                      <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 12px;">
                        © ${new Date().getFullYear()} ${data.companyName}. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${data.to}`);
      return true; // ✅ Return success
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return false; // ✅ Explicit failure
    }
  }

  async sendOtpEmail(data: {
    to: string;
    firstName: string;
    lastName: string;
    otp: string;
    companyName: string;
  }) {
    // Use EMAIL_FROM if set, otherwise use EMAIL_USER (required by some mail servers like iRedMail)
    const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER || '';
    const fromEmail = process.env.EMAIL_FROM || smtpUser || "noreply@ratehonk.com";
    
    console.log("📧 Sending OTP email:", {
      from: fromEmail,
      to: data.to,
      smtpHost: process.env.SMTP_HOST || process.env.MAIL_HOST,
      smtpPort: process.env.SMTP_PORT || process.env.MAIL_PORT || '587',
      smtpUser: smtpUser ? `${smtpUser.substring(0, 3)}***` : 'Not set',
    });
    
    const mailOptions = {
      from: fromEmail,
      to: data.to,
      subject: "Email Verification - RateHonk CRM",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Email Verification</h1>
          </div>
          <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello ${data.firstName} ${data.lastName},</p>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
              Thank you for registering with ${data.companyName}! To complete your registration and verify your email address, please use the OTP (One-Time Password) below:
            </p>
            <div style="background-color: #f5f5f5; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="color: #333; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Your Verification Code:</p>
              <p style="color: #667eea; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${data.otp}</p>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              This OTP will expire in 10 minutes for security purposes. Please enter this code on the verification page to activate your account.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              If you didn't create an account with ${data.companyName}, please ignore this email.
            </p>
            <p style="color: #333; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              <strong>The RateHonk CRM Team</strong>
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent successfully to ${data.to}`);
      return true;
    } catch (error: any) {
      console.error("❌ Error sending OTP email:");
      console.error("   Error Code:", error.code);
      console.error("   Error Message:", error.message);
      console.error("   Response:", error.response);
      console.error("   Command:", error.command);
      
      // Provide helpful error messages for common issues
      if (error.code === 'EAUTH') {
        console.error("   🔍 Authentication failed. Please check:");
        console.error("      - EMAIL_USER/EMAIL_PASS or SMTP_USER/SMTP_PASS are correct");
        console.error("      - Email and password match your mail server credentials");
        console.error("      - Account is not locked or disabled");
        console.error("      - For iRedMail: Ensure SMTP authentication is enabled for this account");
      } else if (error.code === 'ECONNECTION') {
        console.error("   🔍 Connection failed. Please check:");
        console.error("      - SMTP_HOST is correct");
        console.error("      - SMTP_PORT is correct (587 for STARTTLS, 465 for TLS/SSL)");
        console.error("      - Firewall allows outbound connections on SMTP port");
      } else if (error.code === 'ETIMEDOUT') {
        console.error("   🔍 Connection timeout. Please check:");
        console.error("      - SMTP server is reachable");
        console.error("      - Network connectivity");
      }
      
      return false;
    }
  }

  async sendActivationEmail(data: {
    to: string;
    firstName: string;
    lastName: string;
    activationToken: string;
    companyName: string;
  }) {
    console.log("📧 ===== sendActivationEmail CALLED =====");
    console.log("📧 Data received:", {
      to: data.to,
      firstName: data.firstName,
      lastName: data.lastName,
      companyName: data.companyName,
      tokenLength: data.activationToken.length,
    });

    try {
      // Get correct base URL using helper function
      const baseUrl = getBaseUrl();
      const activationUrl = `${baseUrl}/activate?token=${data.activationToken}`;
      
      console.log("📧 Base URL:", baseUrl);
      console.log("📧 Activation URL:", activationUrl);

      // Check if transporter exists
      if (!this.transporter) {
        console.error("❌ CRITICAL: Email transporter is not initialized!");
        throw new Error("Email transporter is not initialized");
      }
      console.log("✅ Transporter exists and is ready");

      // IMPORTANT: Use SMTP user email as "from" to avoid SPF/DKIM failures
      // Many SMTP servers reject emails when "from" doesn't match authenticated user
      const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER || "support@vanitechnologies.in";
      const fromEmail = smtpUser; // Force use of SMTP user email for better deliverability
      
      const mailOptions = {
        from: fromEmail,
        to: data.to,
        subject: "Activate Your Account - RateHonk CRM",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to RateHonk CRM!</h2>
            <p>Hello ${data.firstName} ${data.lastName},</p>
            <p>Thank you for registering with ${data.companyName}. To complete your registration and activate your account, please click the link below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Activate Account</a>
            </div>
            <p>This activation link will expire in 24 hours for security purposes.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            <p>Best regards,<br>The RateHonk Team</p>
          </div>
        `,
      };

      console.log("📧 Mail options prepared:");
      console.log("📧   From:", mailOptions.from);
      console.log("📧   To:", mailOptions.to);
      console.log("📧   Subject:", mailOptions.subject);
      console.log("📧 Attempting to send email via transporter...");

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log("✅ ===== ACTIVATION EMAIL SENT SUCCESSFULLY =====");
      console.log(`✅ Activation email sent successfully to ${data.to}`);
      console.log("📧 Message ID:", result.messageId);
      console.log("📧 Response:", result.response);
      console.log("📧 Accepted:", result.accepted);
      console.log("📧 Rejected:", result.rejected);
      
      return true;
    } catch (error: any) {
      console.error("❌ ===== ERROR SENDING ACTIVATION EMAIL =====");
      console.error("❌ Error type:", error?.constructor?.name);
      console.error("❌ Error message:", error?.message);
      console.error("❌ Error code:", error?.code);
      console.error("❌ Error command:", error?.command);
      console.error("❌ Error response:", error?.response);
      console.error("❌ Error responseCode:", error?.responseCode);
      console.error("❌ Error stack:", error?.stack);
      console.error("❌ Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return false;
    }
  }

  async sendLoginVerificationCode(data: {
    to: string;
    firstName: string;
    lastName: string;
    verificationCode: string;
  }) {
    try {
      // Check if transporter is initialized
      if (!this.transporter) {
        console.error("❌ CRITICAL: Email transporter is not initialized!");
        return false;
      }

      // IMPORTANT: Use SMTP user email as "from" to avoid SPF/DKIM failures
      // Many SMTP servers reject emails when "from" doesn't match authenticated user
      const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER || "support@vanitechnologies.in";
      const smtpHost = process.env.SMTP_HOST || "mail.vanitechnologies.in";
      const smtpPort = parseInt(process.env.SMTP_PORT || "587");
      const fromEmail = smtpUser; // Force use of SMTP user email for better deliverability
      
      console.log("📧 ===== sendLoginVerificationCode CALLED =====");
      console.log("📧 Environment Check:", {
        SMTP_HOST: smtpHost,
        SMTP_PORT: smtpPort,
        EMAIL_USER: process.env.EMAIL_USER ? "✅ Set" : "❌ Not set",
        SMTP_USER: process.env.SMTP_USER ? "✅ Set" : "❌ Not set",
        EMAIL_PASS: process.env.EMAIL_PASS ? "✅ Set" : "❌ Not set",
        SMTP_PASS: process.env.SMTP_PASS ? "✅ Set" : "❌ Not set",
        NODE_ENV: process.env.NODE_ENV,
      });
      
      const mailOptions = {
        from: fromEmail,
        to: data.to,
        subject: "Your Login Verification Code - RateHonk CRM",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Login Verification Code</h2>
            <p>Hello ${data.firstName} ${data.lastName},</p>
            <p>You have requested to log in to your RateHonk CRM account. Please use the verification code below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; display: inline-block;">
                <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${data.verificationCode}</h1>
              </div>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes for security purposes.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
            <p>Best regards,<br>The RateHonk Team</p>
          </div>
        `,
      };

      console.log("📧 Attempting to send login verification code...");
      console.log("📧 To:", data.to);
      console.log("📧 Code:", data.verificationCode);
      console.log("📧 From:", mailOptions.from);
      
      // Verify SMTP connection before sending
      try {
        console.log("📧 Verifying SMTP connection...");
        await this.transporter.verify();
        console.log("✅ SMTP connection verified successfully");
      } catch (verifyError: any) {
        console.error("❌ SMTP verification failed:", verifyError?.message);
        console.error("❌ SMTP verification error code:", verifyError?.code);
        console.error("❌ SMTP verification command:", verifyError?.command);
        console.error("❌ SMTP verification response:", verifyError?.response);
        console.error("❌ This may cause the email to fail");
        // Don't return false here - try to send anyway as some servers have verify issues but can still send
      }
      
      console.log("📧 Sending email via transporter...");
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Login verification code sent successfully to ${data.to}`);
      console.log("📧 Message ID:", result.messageId);
      console.log("📧 Response:", result.response);
      console.log("📧 Accepted:", result.accepted);
      console.log("📧 Rejected:", result.rejected);
      return true;
    } catch (error: any) {
      console.error("❌ ===== ERROR SENDING LOGIN VERIFICATION CODE =====");
      console.error("❌ Error type:", error?.constructor?.name);
      console.error("❌ Error message:", error?.message);
      console.error("❌ Error code:", error?.code);
      console.error("❌ Error command:", error?.command);
      console.error("❌ Error response:", error?.response);
      console.error("❌ Error responseCode:", error?.responseCode);
      console.error("❌ Error stack:", error?.stack);
      console.error("❌ Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return false;
    }
  }

  async sendConsulationFormEmail(data: {
    to: string;
    customerName: string;
    formUrl: string;
    tenantName?: string;
    formType?: 'consulation' | 'payment';
  }) {
    try {
      if (!this.transporter) {
        throw new Error("Email transporter is not initialized");
      }

      const smtpUser =
        process.env.EMAIL_USER ||
        process.env.SMTP_USER ||
        "support@vanitechnologies.in";
      // const fromEmail = process.env.EMAIL_FROM || smtpUser;
      const fromEmail = "support@vanitechnologies.in";
      const formUrl = data.formUrl || `${getBaseUrl()}/consulation-form`;
      const formType = data.formType || 'consulation';
      const formName = formType === 'payment' ? 'Payment' : 'Consulation';
      const formNameLower = formType === 'payment' ? 'payment' : 'consulation';
      const emailSubject = `${formName} Form - RateHonk CRM`;
      const emailTitle = `${formName} Form`;
      const emailDescription = formType === 'payment' 
        ? 'To help us process your payment, please take a moment to complete the form using the link below:'
        : 'To help us prepare for your upcoming consulation, please take a moment to complete the form using the link below:';

      const mailOptions = {
        from: fromEmail,
        to: data.to,
        subject: emailSubject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
              <tr>
                <td style="padding: 20px 10px;">
                  <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 30px 20px;">
                        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">${emailTitle}</h2>
                        <p style="color: #666; margin: 0 0 15px 0; font-size: 16px; line-height: 1.5;">Hi ${data.customerName || "there"},</p>
                        <p style="color: #666; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">${emailDescription}</p>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${formUrl}" style="background-color: #0E76BC; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: 600; min-width: 200px; box-sizing: border-box;">Open ${formName} Form</a>
                        </div>
                        <p style="color: #666; margin: 30px 0 15px 0; font-size: 14px; line-height: 1.5;">If the button above does not work, copy and paste this link into your browser:</p>
                        <p style="margin: 0 0 30px 0; word-break: break-all;">
                          <a href="${formUrl}" style="color: #0E76BC; text-decoration: underline; font-size: 14px;">${formUrl}</a>
                        </p>
                        <p style="color: #666; margin: 30px 0 0 0; font-size: 14px;">Thank you!<br/>${data.tenantName || "RateHonk CRM Team"}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

      console.log("📧 Sending consulation form email:", {
        to: data.to,
        formUrl,
      });

      const result = await this.transporter.sendMail(mailOptions);
      console.log("✅ Consulation form email sent:", result.messageId);
      return true;
    } catch (error: any) {
      console.error("❌ Error sending consulation form email:", error);
      return false;
    }
  }

  async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    tenantId?: number;
  }) {
    try {
      if (!this.transporter) {
        console.error("❌ Email transporter is not initialized!");
        return false;
      }

      const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER || "support@vanitechnologies.in";
      const fromEmail = smtpUser;

      const mailOptions = {
        from: fromEmail,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text || data.html.replace(/<[^>]*>/g, ""),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${data.to}:`, result.messageId);
      return true;
    } catch (error: any) {
      console.error("❌ Error sending email:", error);
      return false;
    }
  }

  async sendFollowUpAssignmentEmail(data: {
    to: string;
    assignedUserName: string;
    createdByName: string;
    followUpTitle: string;
    followUpDescription?: string;
    dueDate: string;
    priority: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
    relatedEntityName?: string;
    followUpId: number;
    tenantId: number;
    previousUserName?: string; // For reassignments
    isReassignment?: boolean; // Flag to indicate if this is a reassignment
  }) {
    try {
      const baseUrl = getBaseUrl();
      const followUpUrl = `${baseUrl}/dashboard`;
      const priorityColors: Record<string, string> = {
        low: '#6B7280',
        medium: '#3B82F6',
        high: '#F59E0B',
        urgent: '#EF4444'
      };
      const priorityColor = priorityColors[data.priority] || '#3B82F6';
      
      let relatedEntitySection = '';
      if (data.relatedEntityType && data.relatedEntityId && data.relatedEntityName) {
        const entityTypeMap: Record<string, string> = {
          leads: 'Lead',
          customers: 'Customer',
          invoices: 'Invoice',
          bookings: 'Booking',
          estimates: 'Estimate',
          expenses: 'Expense'
        };
        const entityTypeLabel = entityTypeMap[data.relatedEntityType] || data.relatedEntityType;
        relatedEntitySection = `
          <tr>
            <td style="padding: 10px 0;">
              <strong>Related To:</strong> ${entityTypeLabel} - ${data.relatedEntityName}
            </td>
          </tr>
        `;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">${data.isReassignment ? 'Follow-Up Reassigned' : 'New Follow-Up Assigned'}</h2>
            <p>Hello ${data.assignedUserName},</p>
            <p>${data.isReassignment && data.previousUserName 
              ? `A follow-up has been moved from ${data.previousUserName} to you:` 
              : 'A new follow-up has been assigned to you:'}</p>
            ${data.isReassignment && data.previousUserName ? `
            <p style="background-color: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107; margin-top: 10px;">
              <strong>Note:</strong> This follow-up was previously assigned to ${data.previousUserName} and has now been reassigned to you.
            </p>
            ` : ''}
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Title:</strong> ${data.followUpTitle}
                </td>
              </tr>
              ${data.followUpDescription ? `
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Description:</strong><br>
                  <div style="margin-top: 5px; color: #666;">${data.followUpDescription}</div>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Priority:</strong> 
                  <span style="background-color: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
                    ${data.priority}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Assigned By:</strong> ${data.createdByName}
                </td>
              </tr>
              ${relatedEntitySection}
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${followUpUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Follow-Up in Dashboard
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
            <p>This is an automated notification from RateHonk CRM.</p>
            <p>If you have any questions, please contact your system administrator.</p>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || "noreply@ratehonk.com",
        to: data.to,
        subject: `New Follow-Up Assigned: ${data.followUpTitle}`,
        html: html,
      };

      console.log("📧 Sending follow-up assignment email:", {
        to: data.to,
        followUpTitle: data.followUpTitle,
      });

      const result = await this.transporter.sendMail(mailOptions);
      console.log("✅ Follow-up assignment email sent:", result.messageId);
      return true;
    } catch (error: any) {
      console.error("❌ Error sending follow-up assignment email:", error);
      return false;
    }
  }

  async sendTaskAssignmentEmail(data: {
    to: string;
    assignedUserName: string;
    createdByName: string;
    taskTitle: string;
    taskDescription?: string;
    dueDate: string;
    endDate?: string;
    priority: string;
    taskType: string;
    taskId: number;
    tenantId: number;
    isReportingUser?: boolean;
  }) {
    try {
      const baseUrl = getBaseUrl();
      const taskUrl = `${baseUrl}/tasks`;
      const priorityColors: Record<string, string> = {
        low: '#6B7280',
        medium: '#3B82F6',
        high: '#F59E0B',
        urgent: '#EF4444'
      };
      const priorityColor = priorityColors[data.priority] || '#3B82F6';
      
      const taskTypeLabels: Record<string, string> = {
        follow_up: 'Follow Up',
        call: 'Phone Call',
        email: 'Email',
        meeting: 'Meeting',
        quote: 'Send Quote',
        booking: 'Process Booking',
        general: 'General Task'
      };
      const taskTypeLabel = taskTypeLabels[data.taskType] || data.taskType;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">${data.isReportingUser ? 'Task Notification' : 'New Task Assigned'}</h2>
            <p>Hello ${data.isReportingUser ? 'Manager' : data.assignedUserName},</p>
            <p>${data.isReportingUser ? `A new task has been assigned to ${data.assignedUserName}:` : 'A new task has been assigned to you:'}</p>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Task Title:</strong> ${data.taskTitle}
                </td>
              </tr>
              ${data.taskDescription ? `
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Description:</strong><br>
                  <div style="margin-top: 5px; color: #666;">${data.taskDescription}</div>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Task Type:</strong> ${taskTypeLabel}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleString()}
                </td>
              </tr>
              ${data.endDate ? `
              <tr>
                <td style="padding: 10px 0;">
                  <strong>End Date:</strong> ${new Date(data.endDate).toLocaleString()}
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Priority:</strong> 
                  <span style="background-color: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
                    ${data.priority}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Assigned By:</strong> ${data.createdByName}
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Task in Dashboard
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
            <p>This is an automated notification from RateHonk CRM.</p>
            <p>If you have any questions, please contact your system administrator.</p>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || "noreply@ratehonk.com",
        to: data.to,
        subject: `New Task Assigned: ${data.taskTitle}`,
        html: html,
      };

      console.log("📧 Sending task assignment email:", {
        to: data.to,
        taskTitle: data.taskTitle,
      });

      const result = await this.transporter.sendMail(mailOptions);
      console.log("✅ Task assignment email sent:", result.messageId);
      return true;
    } catch (error: any) {
      console.error("❌ Error sending task assignment email:", error);
      return false;
    }
  }

  async sendTaskUpdateEmail(data: {
    to: string;
    assignedUserName: string;
    updatedByName: string;
    taskTitle: string;
    taskDescription?: string;
    dueDate: string;
    endDate?: string;
    priority: string;
    taskType: string;
    taskId: number;
    tenantId: number;
    oldStatus?: string;
    newStatus: string;
    statusChanged: boolean;
    isReportingUser?: boolean;
  }) {
    try {
      const baseUrl = getBaseUrl();
      const taskUrl = `${baseUrl}/tasks`;
      const priorityColors: Record<string, string> = {
        low: '#6B7280',
        medium: '#3B82F6',
        high: '#F59E0B',
        urgent: '#EF4444'
      };
      const priorityColor = priorityColors[data.priority] || '#3B82F6';
      
      const taskTypeLabels: Record<string, string> = {
        follow_up: 'Follow Up',
        call: 'Phone Call',
        email: 'Email',
        meeting: 'Meeting',
        quote: 'Send Quote',
        booking: 'Process Booking',
        general: 'General Task'
      };
      const taskTypeLabel = taskTypeLabels[data.taskType] || data.taskType;

      const statusLabels: Record<string, string> = {
        pending: 'Pending',
        in_progress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled',
        overdue: 'Overdue'
      };

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Task Updated</h2>
            <p>Hello ${data.isReportingUser ? 'Manager' : data.assignedUserName},</p>
            <p>${data.isReportingUser ? `A task assigned to ${data.assignedUserName} has been updated:` : 'A task assigned to you has been updated:'}</p>
            ${data.statusChanged && data.oldStatus ? `
            <p style="background-color: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px;">
              <strong>Status Changed:</strong> ${statusLabels[data.oldStatus] || data.oldStatus} → ${statusLabels[data.newStatus] || data.newStatus}
            </p>
            ` : ''}
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Task Title:</strong> ${data.taskTitle}
                </td>
              </tr>
              ${data.taskDescription ? `
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Description:</strong><br>
                  <div style="margin-top: 5px; color: #666;">${data.taskDescription}</div>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Task Type:</strong> ${taskTypeLabel}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleString()}
                </td>
              </tr>
              ${data.endDate ? `
              <tr>
                <td style="padding: 10px 0;">
                  <strong>End Date:</strong> ${new Date(data.endDate).toLocaleString()}
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Priority:</strong> 
                  <span style="background-color: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
                    ${data.priority}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Current Status:</strong> 
                  <span style="background-color: ${data.newStatus === 'completed' ? '#10B981' : data.newStatus === 'in_progress' ? '#3B82F6' : '#6B7280'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
                    ${statusLabels[data.newStatus] || data.newStatus}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <strong>Updated By:</strong> ${data.updatedByName}
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Task in Dashboard
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
            <p>This is an automated notification from RateHonk CRM.</p>
            <p>If you have any questions, please contact your system administrator.</p>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || "noreply@ratehonk.com",
        to: data.to,
        subject: `Task Updated${data.statusChanged ? ` - Status Changed` : ''}: ${data.taskTitle}`,
        html: html,
      };

      console.log("📧 Sending task update email:", {
        to: data.to,
        taskTitle: data.taskTitle,
        statusChanged: data.statusChanged,
      });

      const result = await this.transporter.sendMail(mailOptions);
      console.log("✅ Task update email sent:", result.messageId);
      return true;
    } catch (error: any) {
      console.error("❌ Error sending task update email:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
