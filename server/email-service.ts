// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

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
          <p>You can access the system at: <a href="${process.env.APP_URL || "https://your-app-url.com"}">Login Here</a></p>
          
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
    const resetUrl = `${process.env.APP_URL || "https://your-app-url.com"}/reset-password?token=${data.resetToken}`;

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

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${data.to}`);
      return true; // ✅ Return success
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return false; // ✅ Explicit failure
    }
  }
}

export const emailService = new EmailService();
