// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

// Helper function to get correct base URL
function getBaseUrl(): string {
  try {
    let baseUrl = process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:5000";
    
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
    // Create transporter with a common email service (you can configure this with real SMTP)
    console.log("SMTP Credential", {
      host: "mail.vanitechnologies.in", // Replace with your SMTP host
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || "support@vanitechnologies.in",
        pass: process.env.EMAIL_PASS || "Support@2025",
      },
    });
    this.transporter = nodemailer.createTransport({
      host: "mail.vanitechnologies.in", // Replace with your SMTP host
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || "support@vanitechnologies.in",
        pass: process.env.EMAIL_PASS || "Support@2025",
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
  }) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@ratehonk.com",
      to: data.to,
      subject: `Welcome to ${data.companyName} - Your Account Details`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to ${data.companyName}!</h2>
          
          <p>Hello ${data.firstName} ${data.lastName},</p>
          
          <p>Your account has been created in our RateHonk CRM system.</p>
          <p>You can access the system at: <a href="${getBaseUrl()}">Login Here</a></p>
          
          <p>If you have any questions, please contact your system administrator.</p>
          
          <p>Best regards,<br>The Ratehonk Team</p>
        </div>
      `,
    };
    // <p>Your account has been created in our RateHonk CRM system. Here are your login details:</p>
    // <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
    //   <p><strong>Email:</strong> ${data.email}</p>
    //   <p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>
    // </div>

    // <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
    console.log("mailOptions:", mailOptions);
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
    console.log("📧 ===== sendPasswordResetEmail CALLED =====");
    console.log("📧 Data received:", {
      to: data.to,
      displayName: data.displayName,
      companyName: data.companyName,
      tokenLength: data.resetToken.length,
    });

    try {
      // Get correct base URL using helper function
      const baseUrl = getBaseUrl();
      const resetUrl = `${baseUrl}/reset-password?token=${data.resetToken}`;
      console.log("📧 Base URL:", baseUrl);
      console.log("📧 Reset URL:", resetUrl);

      // Check if transporter exists
      if (!this.transporter) {
        console.error("❌ CRITICAL: Email transporter is not initialized!");
        throw new Error("Email transporter is not initialized");
      }
      console.log("✅ Transporter exists and is ready");

      const mailOptions = {
        from: process.env.EMAIL_FROM || "noreply@ratehonk.com",
        to: data.to,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${data.displayName},</p>
            <p>We received a request to reset your password for your ${data.companyName} account.</p>
            <p>Click the link below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>This link will expire in 1 hour for security purposes.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Best regards,<br>The ${data.companyName} Team</p>
          </div>
        `,
      };

      console.log("📧 Mail options prepared:");
      console.log("📧   From:", mailOptions.from);
      console.log("📧   To:", mailOptions.to);
      console.log("📧   Subject:", mailOptions.subject);
      console.log("📧 Attempting to send email via transporter...");

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log("✅ ===== EMAIL SENT SUCCESSFULLY =====");
      console.log(`✅ Password reset email sent successfully to ${data.to}`);
      console.log("📧 Message ID:", result.messageId);
      console.log("📧 Response:", result.response);
      console.log("📧 Accepted:", result.accepted);
      console.log("📧 Rejected:", result.rejected);
      
      return true; // ✅ Return success
    } catch (error: any) {
      console.error("❌ ===== ERROR SENDING PASSWORD RESET EMAIL =====");
      console.error("❌ Error type:", error?.constructor?.name);
      console.error("❌ Error message:", error?.message);
      console.error("❌ Error code:", error?.code);
      console.error("❌ Error command:", error?.command);
      console.error("❌ Error response:", error?.response);
      console.error("❌ Error responseCode:", error?.responseCode);
      console.error("❌ Error stack:", error?.stack);
      console.error("❌ Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return false; // ✅ Explicit failure
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

      const mailOptions = {
        from: process.env.EMAIL_FROM || "noreply@ratehonk.com",
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
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@ratehonk.com",
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

    try {
      console.log("📧 Attempting to send login verification code...");
      console.log("📧 To:", data.to);
      console.log("📧 Code:", data.verificationCode);
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Login verification code sent successfully to ${data.to}`);
      console.log("📧 Message ID:", result.messageId);
      return true;
    } catch (error: any) {
      console.error("❌ Error sending login verification code:", error);
      console.error("❌ Error details:", {
        message: error?.message,
        code: error?.code,
        command: error?.command,
        response: error?.response,
        responseCode: error?.responseCode,
      });
      return false;
    }
  }
}

export const emailService = new EmailService();
