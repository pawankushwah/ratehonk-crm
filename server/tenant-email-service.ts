import nodemailer from "nodemailer";
import { sql } from "./db";
import { config } from "./config";
import * as fs from "fs";
import * as path from "path";

class TenantEmailService {
  private saasOwnerTransporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize SaaS owner transporter - this will be loaded when needed
  }

  private async getSaasOwnerEmailConfig() {
    try {
      // Priority 1: explicit SaaS owner config flagged in DB
      let [config] = await sql`
        SELECT * FROM email_configurations 
        WHERE is_saas_smtp = true AND is_active = true AND is_smtp_enabled = true
        LIMIT 1
      `;

      if (config) {
        console.log(
          `📧 Found SaaS owner SMTP config (is_saas_smtp=true): host=${config.smtp_host}, user=${config.smtp_username}`,
        );
      } else {
        // Priority 2: legacy tenant_id = 1 record (pre-flag rollout)
        [config] = await sql`
          SELECT * FROM email_configurations 
          WHERE tenant_id = 1 AND is_active = true AND is_smtp_enabled = true
          LIMIT 1
        `;
        if (config) {
          console.log(
            `📧 Found legacy SaaS owner SMTP config for tenant_id=1: host=${config.smtp_host}, user=${config.smtp_username}`,
          );
        } else {
          // Priority 3: first available active SMTP config (as last resort)
          [config] = await sql`
            SELECT * FROM email_configurations 
            WHERE is_active = true AND is_smtp_enabled = true
            ORDER BY tenant_id ASC NULLS LAST
            LIMIT 1
          `;
          if (config) {
            console.log(
              `📧 No SaaS owner config found, using tenant ${config.tenant_id ?? "unknown"} as fallback: host=${config.smtp_host}, user=${config.smtp_username}`,
            );
          } else {
            console.log(`📧 No SaaS owner SMTP config found (no active enabled configs in database)`);
          }
        }
      }

      if (!config) {
        return null;
      }

      // Skip DB config if it points to localhost/127.0.0.1 so fallback uses .env (real SMTP)
      const rawHost = (config?.smtp_host || "").toLowerCase().trim();
      const normalizedHost = rawHost
        .replace(/^smtp:\/\//, "")
        .replace(/^https?:\/\//, "")
        .split("/")[0]
        .split(":")[0]
        .trim();
      const isLocalHost =
        normalizedHost === "127.0.0.1" ||
        normalizedHost === "localhost" ||
        normalizedHost === "::1" ||
        normalizedHost === "0.0.0.0";
      if (isLocalHost) {
        console.log(`📧 Skipping SaaS owner SMTP from DB (host=${config.smtp_host} is local); will use .env SMTP`);
        return null;
      }

      return config;
    } catch (error) {
      console.error("Error fetching SaaS owner email config:", error);
      return null;
    }
  }

  private async getTenantEmailConfig(tenantId: number) {
    try {
      const [config] = await sql`
        SELECT * FROM email_configurations 
        WHERE tenant_id = ${tenantId} AND is_active = true AND is_smtp_enabled = true
      `;
      if (config) {
        console.log(`📧 Found tenant SMTP config for tenant ${tenantId}: host=${config.smtp_host}, user=${config.smtp_username}`);
      } else {
        console.log(`📧 No tenant SMTP config found for tenant ${tenantId} (is_active=true AND is_smtp_enabled=true required)`);
      }
      return config;
    } catch (error) {
      console.error("Error fetching tenant email config:", error);
      return null;
    }
  }

  private createTenantTransporter(config: any): nodemailer.Transporter {
    const port = config.smtp_port || 587;
    const security = config.smtp_security || "tls";
    
    // Determine secure setting:
    // - Port 465 uses direct TLS/SSL (secure: true)
    // - Port 587 uses STARTTLS (secure: false)
    // - "ssl" security type uses secure: true
    // - "tls" security type uses secure: false with requireTLS
    let secure = false;
    if (security === "ssl" || port === 465) {
      secure = true;
    } else {
      secure = false; // Port 587 uses STARTTLS
    }

    const transportConfig: any = {
      host: config.smtp_host,
      port: port,
      secure: secure,
      auth: {
        user: config.smtp_username,
        pass: config.smtp_password,
      },
      // Add requireTLS option for port 587 to ensure STARTTLS is used
      requireTLS: !secure && port === 587,
      tls: {
        // Do not fail on invalid certificates (useful for self-signed certs)
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
      },
    };

    return nodemailer.createTransport(transportConfig);
  }

  async sendWelcomeEmail(data: {
    to: string;
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
    temporaryPassword: string;
    tenantId: number;
  }) {
    try {
      let transporter: nodemailer.Transporter | null = null;
      let fromEmail = "noreply@ratehonk.com";
      let emailSource = "";

      // Priority 1: Try tenant-specific SMTP configuration
      const tenantConfig = await this.getTenantEmailConfig(data.tenantId);
      if (tenantConfig) {
        transporter = this.createTenantTransporter(tenantConfig);
        // Use SMTP username as sender to avoid authentication issues
        fromEmail = tenantConfig.smtp_username;
        emailSource = "tenant SMTP";
        console.log(`📧 Using tenant-specific SMTP for ${data.companyName}`);
      } else {
        // Priority 2: Try SaaS owner SMTP configuration
        const saasOwnerConfig = await this.getSaasOwnerEmailConfig();
        if (saasOwnerConfig) {
          transporter = this.createTenantTransporter(saasOwnerConfig);
          // Use SMTP username as sender to avoid authentication issues
          fromEmail = saasOwnerConfig.smtp_username;
          emailSource = "SaaS owner SMTP";
          console.log(
            `📧 Using SaaS owner SMTP for ${data.companyName} (no tenant config)`,
          );
        } else {
          // Priority 3: Use environment variables from config (global fallback)
          const smtpConfig = config.email.smtp;
          if (smtpConfig.user && smtpConfig.pass && smtpConfig.host) {
            transporter = nodemailer.createTransport({
              host: smtpConfig.host,
              port: smtpConfig.port,
              secure: smtpConfig.secure,
              auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
              },
              requireTLS: !smtpConfig.secure && smtpConfig.port === 587,
              tls: {
                rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
              },
            });
            fromEmail = smtpConfig.fromEmail || smtpConfig.user;
            emailSource = "environment variables (config)";
            console.log(
              `📧 Using environment SMTP from config for ${data.companyName} (no configured SMTP found)`,
            );
            console.log(`📧 SMTP Config: host=${smtpConfig.host}, port=${smtpConfig.port}, user=${smtpConfig.user.substring(0, 3)}***`);
          } else {
            // Final fallback: Try environment variables (support both SMTP_* and EMAIL_* for compatibility)
            const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST;
            const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || "587");
            const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER || "";
            const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || "";
            
            if (smtpUser && smtpPass && smtpHost) {
              // Determine secure setting for port 587 (STARTTLS) vs 465 (TLS/SSL)
              let secure = false;
              if (process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === 'ssl') {
                secure = true;
              } else if (process.env.SMTP_SECURE === 'false' || process.env.SMTP_SECURE === 'tls' || smtpPort === 587) {
                secure = false; // Port 587 uses STARTTLS
              } else if (smtpPort === 465) {
                secure = true; // Port 465 uses direct TLS/SSL
              }

              transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: secure,
                auth: {
                  user: smtpUser,
                  pass: smtpPass,
                },
                requireTLS: !secure && smtpPort === 587,
                tls: {
                  rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
                },
              });
              fromEmail = process.env.EMAIL_FROM || smtpUser || "noreply@ratehonk.com";
              emailSource = "environment variables (legacy)";
              console.log(`📧 Using environment SMTP for ${data.companyName}: host=${smtpHost}, port=${smtpPort}, user=${smtpUser.substring(0, 3)}***`);
            } else {
              throw new Error("No email configuration available. Please configure SMTP settings in .env file or tenant settings.");
            }
          }
        }
      }

      if (!transporter) {
        throw new Error("Failed to create email transporter");
      }

      // Format fromEmail with company name as display name
      const fromEmailWithName = fromEmail.includes("@") 
        ? `"${data.companyName}" <${fromEmail}>`
        : fromEmail;

      const mailOptions = {
        from: fromEmailWithName,
        to: data.to,
        subject: `Welcome to ${data.companyName} - Your Account Details`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to ${data.companyName}!</h2>
            
            <p>Hello ${data.firstName} ${data.lastName},</p>
            
            <p>Your account has been created in our RateHonk CRM system. Here are your login details:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>
            </div>
            
            <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
            
            <p>You can access the system at: <a href="${process.env.APP_URL || "https://your-app-url.com"}">Login Here</a></p>
            
            <p>If you have any questions, please contact your system administrator.</p>
            
            <p>Best regards,<br>The ${data.companyName} Team</p>
          </div>
        `,
      };

      console.log(
        `📧 Attempting to send email to ${data.to} using ${emailSource}`,
      );
      console.log(
        `📧 SMTP Config - Host: ${(transporter.options as any)?.host}, Port: ${(transporter.options as any)?.port}`,
      );

      // Test SMTP connection first
      try {
        await transporter.verify();
        console.log(`✅ SMTP connection verified for ${emailSource}`);
      } catch (verifyError: any) {
        console.error(
          `❌ SMTP verification failed for ${emailSource}:`,
          verifyError,
        );
        throw new Error(`SMTP connection failed: ${verifyError.message}`);
      }

      const result = await transporter.sendMail(mailOptions);
      console.log(
        `✅ Welcome email sent to ${data.to} using ${emailSource}`,
        result.messageId,
      );
      return true;
    } catch (error: any) {
      console.error(`❌ Error sending welcome email to ${data.to}:`, error);
      console.error(
        `❌ Full error details:`,
        error.message,
        error.code,
        error.command,
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(data: {
    to: string;
    firstName: string;
    resetToken: string;
    companyName: string;
    tenantId: number;
  }) {
    try {
      // Try to get tenant-specific email configuration
      const tenantConfig = await this.getTenantEmailConfig(data.tenantId);
      let transporter: nodemailer.Transporter | null = null;
      let fromEmail = process.env.EMAIL_FROM || "noreply@ratehonk.com";

      if (tenantConfig) {
        transporter = this.createTenantTransporter(tenantConfig);
        fromEmail = tenantConfig.sender_email || tenantConfig.smtp_username;
      } else {
        throw new Error("No email configuration available");
      }

      const resetUrl = `${process.env.APP_URL || "https://your-app-url.com"}/reset-password?token=${data.resetToken}`;

      const mailOptions = {
        from: fromEmail,
        to: data.to,
        subject: `Reset Your Password - ${data.companyName}`,
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
                          Hello <strong style="color: #111827;">${data.firstName}</strong>,
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

      if (!transporter) {
        throw new Error("No email transporter configured");
      }

      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${data.to}`);
      return true;
    } catch (error: any) {
      console.error(
        `❌ Error sending password reset email to ${data.to}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Helper function to check if email domain matches SMTP server domain
   * This helps detect potential SPF/DKIM issues
   */
  private checkDomainMatch(email: string, smtpHost: string): boolean {
    if (!email || !smtpHost) return false;
    const emailDomain = email.split("@")[1]?.toLowerCase();
    const smtpDomain = smtpHost.replace(/^mail\./, "").toLowerCase(); // Remove "mail." prefix if present
    return emailDomain === smtpDomain || smtpHost.includes(emailDomain);
  }

  async sendCustomerEmail(data: {
    to: string;
    subject: string;
    body: string;
    htmlBody?: string;
    tenantId: number;
    fromName?: string; // Optional: Override the "from" name with tenant company name
    attachments?: Array<{
      filename: string;
      path?: string;
      content?: string; // Base64 content
      contentType?: string; // MIME type
    }>;
  }) {
    try {
      let transporter: nodemailer.Transporter | null = null;
      let fromEmail = "noreply@ratehonk.com";
      let emailSource = "";
      let tenantConfig: any = null; // Store tenant config for later use (reply-to)

      // Priority 1: Try tenant-specific SMTP configuration
      tenantConfig = await this.getTenantEmailConfig(data.tenantId);
      if (tenantConfig) {
        transporter = this.createTenantTransporter(tenantConfig);
        // Use sender_email from database if it exists and is valid
        // Otherwise fall back to .env default (SMTP_FROM_EMAIL)
        // IMPORTANT: The "from" email should match or be related to the SMTP username to avoid delivery issues
        if (tenantConfig.sender_email && 
            tenantConfig.sender_email.trim() !== "" && 
            tenantConfig.sender_email !== data.to &&
            tenantConfig.sender_email.includes("@")) {
          // Format: "Sender Name <email@example.com>" - prioritize fromName parameter, then sender_name, then just email
          // If fromName is explicitly provided (not undefined), use it even if empty; otherwise use tenantConfig.sender_name
          const displayName = data.fromName !== undefined ? data.fromName : (tenantConfig.sender_name || "");
          if (displayName && displayName.trim() !== "") {
            fromEmail = `"${displayName}" <${tenantConfig.sender_email}>`;
          } else {
            fromEmail = tenantConfig.sender_email;
          }
          console.log(`📧 Using sender info from database (email-settings): ${fromEmail}`);
          console.log(`📧 fromName parameter: ${data.fromName}, tenantConfig.sender_name: ${tenantConfig.sender_name}, displayName used: ${displayName}`);
          
          // Warn if sender_email doesn't match SMTP username (can cause delivery issues)
          if (tenantConfig.smtp_username && !tenantConfig.sender_email.toLowerCase().includes(tenantConfig.smtp_username.toLowerCase())) {
            console.warn(`⚠️ WARNING: Sender email (${tenantConfig.sender_email}) doesn't match SMTP username (${tenantConfig.smtp_username}). This may cause delivery issues.`);
          }
        } else {
          // IMPORTANT: Always use SMTP username as "from" email to avoid SPF/DKIM issues
          // The "from" email must match the authenticated SMTP user for proper delivery
          const smtpUsername = tenantConfig.smtp_username;
          if (smtpUsername && smtpUsername.includes("@")) {
            // Use SMTP username as from email (required for SPF/DKIM to pass)
            // If fromName is explicitly provided (not undefined), use it even if empty; otherwise use tenantConfig.sender_name
            const displayName = data.fromName !== undefined ? data.fromName : (tenantConfig.sender_name || "");
            if (displayName && displayName.trim() !== "") {
              fromEmail = `"${displayName}" <${smtpUsername}>`;
            } else {
              fromEmail = smtpUsername;
            }
            console.log(`📧 Using SMTP username as from email (required for SPF/DKIM): ${fromEmail}`);
            console.log(`📧 fromName parameter: ${data.fromName}, tenantConfig.sender_name: ${tenantConfig.sender_name}, displayName used: ${displayName}`);
          } else {
            // Fall back to .env default sender email only if SMTP username is not available
            const smtpConfig = config.email.smtp;
            if (smtpConfig.fromEmail) {
              // Prioritize fromName parameter over .env SMTP_FROM_NAME
              const displayName = data.fromName || smtpConfig.fromName || "";
              if (displayName && displayName.trim() !== "") {
                fromEmail = `"${displayName}" <${smtpConfig.fromEmail}>`;
              } else {
                fromEmail = smtpConfig.fromEmail;
              }
              console.log(`📧 No SMTP username available, using .env default: ${fromEmail}`);
              console.log(`📧 fromName parameter: ${data.fromName}, smtpConfig.fromName: ${smtpConfig.fromName}, displayName used: ${displayName}`);
            } else {
              // Last resort: use SMTP user from config
              const smtpUser = smtpConfig.user || "";
              if (smtpUser && smtpUser.includes("@")) {
                const displayName = data.fromName || "";
                if (displayName && displayName.trim() !== "") {
                  fromEmail = `"${displayName}" <${smtpUser}>`;
                } else {
                  fromEmail = smtpUser;
                }
                console.log(`⚠️ Using SMTP user from config as from email: ${fromEmail}`);
              } else {
                throw new Error("No valid email address available for 'from' field. Please configure SMTP username or EMAIL_FROM.");
              }
            }
          }
        }
        emailSource = "tenant SMTP";
        console.log(`📧 Using tenant-specific SMTP for customer email`);
        
        // Check for potential SPF/DKIM issues
        if (tenantConfig.smtp_host && fromEmail.includes("@")) {
          const emailDomain = fromEmail.split("@")[1]?.toLowerCase();
          const smtpDomain = tenantConfig.smtp_host.replace(/^mail\./, "").toLowerCase();
          if (emailDomain && smtpDomain && emailDomain !== smtpDomain && !tenantConfig.smtp_host.includes(emailDomain)) {
            console.warn(`⚠️ SPF WARNING: From email domain (${emailDomain}) doesn't match SMTP server domain (${smtpDomain}).`);
            console.warn(`   This may cause SPF/DKIM failures. Consider using an email from ${smtpDomain} domain.`);
          }
        }
      } else {
        // Priority 2: Try SaaS owner SMTP configuration
        const saasOwnerConfig = await this.getSaasOwnerEmailConfig();
        if (saasOwnerConfig) {
          transporter = this.createTenantTransporter(saasOwnerConfig);
          // Use sender_email from database if it exists and is valid
          // Otherwise fall back to .env default (SMTP_FROM_EMAIL)
          if (saasOwnerConfig.sender_email && 
              saasOwnerConfig.sender_email.trim() !== "" && 
              saasOwnerConfig.sender_email !== data.to &&
              saasOwnerConfig.sender_email.includes("@")) {
            // Format: "Sender Name <email@example.com>" - prioritize fromName parameter, then sender_name
            const displayName = data.fromName || saasOwnerConfig.sender_name || "";
            if (displayName && displayName.trim() !== "") {
              fromEmail = `"${displayName}" <${saasOwnerConfig.sender_email}>`;
            } else {
              fromEmail = saasOwnerConfig.sender_email;
            }
            console.log(`📧 Using SaaS owner sender info from database: ${fromEmail}`);
          } else {
            // IMPORTANT: Always use SMTP username as "from" email to avoid SPF/DKIM issues
            const smtpUsername = saasOwnerConfig.smtp_username;
            if (smtpUsername && smtpUsername.includes("@")) {
              const displayName = data.fromName || saasOwnerConfig.sender_name || "";
              if (displayName && displayName.trim() !== "") {
                fromEmail = `"${displayName}" <${smtpUsername}>`;
              } else {
                fromEmail = smtpUsername;
              }
              console.log(`📧 Using SaaS owner SMTP username as from email (required for SPF/DKIM): ${fromEmail}`);
            } else {
              // Fall back to .env default only if SMTP username is not available
              const smtpConfig = config.email.smtp;
              if (smtpConfig.fromEmail) {
                const displayName = data.fromName || smtpConfig.fromName || "";
                if (displayName && displayName.trim() !== "") {
                  fromEmail = `"${displayName}" <${smtpConfig.fromEmail}>`;
                } else {
                  fromEmail = smtpConfig.fromEmail;
                }
                console.log(`📧 No SMTP username available, using .env default: ${fromEmail}`);
              } else {
                const smtpUser = smtpConfig.user || "";
                if (smtpUser && smtpUser.includes("@")) {
                  const displayName = data.fromName || "";
                  if (displayName && displayName.trim() !== "") {
                    fromEmail = `"${displayName}" <${smtpUser}>`;
                  } else {
                    fromEmail = smtpUser;
                  }
                  console.log(`⚠️ Using SMTP user from config as from email: ${fromEmail}`);
                } else {
                  throw new Error("No valid email address available for 'from' field. Please configure SMTP username or EMAIL_FROM.");
                }
              }
            }
          }
          emailSource = "SaaS owner SMTP";
          console.log(`📧 Using SaaS owner SMTP for customer email (no tenant config)`);
        } else {
          // Priority 3: Use environment variables from config (global fallback)
          const smtpConfig = config.email.smtp;
          if (smtpConfig.user && smtpConfig.pass && smtpConfig.host) {
            transporter = nodemailer.createTransport({
              host: smtpConfig.host,
              port: smtpConfig.port,
              secure: smtpConfig.secure,
              auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
              },
              requireTLS: !smtpConfig.secure && smtpConfig.port === 587,
              tls: {
                rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
              },
            });
            // IMPORTANT: Always use SMTP username as "from" email to avoid SPF/DKIM issues
            // The "from" email must match the authenticated SMTP user for proper delivery
            const smtpUser = smtpConfig.user || "";
            if (smtpUser && smtpUser.includes("@")) {
              // Use SMTP user as from email (required for SPF/DKIM to pass)
              // Prioritize fromName parameter - if explicitly provided (even if empty), use it over .env
              const displayName = data.fromName !== undefined ? data.fromName : (smtpConfig.fromName || "");
              if (displayName && displayName.trim() !== "") {
                fromEmail = `"${displayName}" <${smtpUser}>`;
              } else {
                fromEmail = smtpUser;
              }
              console.log(`📧 Using SMTP user as from email (required for SPF/DKIM): ${fromEmail}`);
              console.log(`📧 fromName parameter: ${data.fromName}, displayName used: ${displayName}`);
            } else if (smtpConfig.fromEmail) {
              // Fallback to fromEmail only if SMTP user is not available
              // Prioritize fromName parameter - if explicitly provided (even if empty), use it over .env
              const displayName = data.fromName !== undefined ? data.fromName : (smtpConfig.fromName || "");
              if (displayName && displayName.trim() !== "") {
                fromEmail = `"${displayName}" <${smtpConfig.fromEmail}>`;
              } else {
                fromEmail = smtpConfig.fromEmail;
              }
              console.log(`📧 No SMTP user available, using .env fromEmail: ${fromEmail}`);
              console.log(`📧 fromName parameter: ${data.fromName}, smtpConfig.fromName: ${smtpConfig.fromName}, displayName used: ${displayName}`);
            } else {
              throw new Error("No valid email address available for 'from' field. Please configure SMTP_USER or EMAIL_FROM.");
            }
            emailSource = "environment variables (config)";
            console.log(`📧 Using environment SMTP from config for customer email (no configured SMTP found)`);
            console.log(`📧 SMTP Config: host=${smtpConfig.host}, port=${smtpConfig.port}, user=${smtpConfig.user}`);
            console.log(`📧 Sender email: ${fromEmail} (from .env SMTP_FROM_EMAIL and SMTP_FROM_NAME)`);
          } else {
            // Final fallback: Try environment variables (support both SMTP_* and EMAIL_* for compatibility)
            const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST;
            const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || "587");
            const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER || "";
            const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || "";
            
            if (smtpUser && smtpPass && smtpHost) {
              // Determine secure setting for port 587 (STARTTLS) vs 465 (TLS/SSL)
              let secure = false;
              if (process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === 'ssl') {
                secure = true;
              } else if (process.env.SMTP_SECURE === 'false' || process.env.SMTP_SECURE === 'tls' || smtpPort === 587) {
                secure = false; // Port 587 uses STARTTLS
              } else if (smtpPort === 465) {
                secure = true; // Port 465 uses direct TLS/SSL
              }

              transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: secure,
                auth: {
                  user: smtpUser,
                  pass: smtpPass,
                },
                requireTLS: !secure && smtpPort === 587,
                tls: {
                  rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
                },
              });
              // IMPORTANT: Always use SMTP username as "from" email to avoid SPF/DKIM issues
              // The "from" email must match the authenticated SMTP user for proper delivery
              if (smtpUser && smtpUser.includes("@")) {
                // Use SMTP user as from email (required for SPF/DKIM to pass)
                const displayName = data.fromName || process.env.SMTP_FROM_NAME || "";
                if (displayName && displayName.trim() !== "") {
                  fromEmail = `"${displayName}" <${smtpUser}>`;
                } else {
                  fromEmail = smtpUser;
                }
                console.log(`📧 Using SMTP user as from email (required for SPF/DKIM): ${fromEmail}`);
              } else {
                // Fallback to EMAIL_FROM only if SMTP user is not available
                const smtpFromEmail = process.env.EMAIL_FROM || "noreply@ratehonk.com";
                const displayName = data.fromName || process.env.SMTP_FROM_NAME || "";
                if (displayName && displayName.trim() !== "") {
                  fromEmail = `"${displayName}" <${smtpFromEmail}>`;
                } else {
                  fromEmail = smtpFromEmail;
                }
                console.warn(`⚠️ WARNING: Using EMAIL_FROM (${smtpFromEmail}) instead of SMTP user. This may cause SPF/DKIM issues.`);
              }
              emailSource = "environment variables (legacy)";
              console.log(`📧 Using environment SMTP for customer email: host=${smtpHost}, port=${smtpPort}, user=${smtpUser.substring(0, 3)}***`);
              
              // Check for potential SPF/DKIM issues
              if (smtpHost && fromEmail.includes("@")) {
                const emailDomain = fromEmail.split("@")[1]?.toLowerCase();
                const smtpDomain = smtpHost.replace(/^mail\./, "").toLowerCase();
                if (emailDomain && smtpDomain && emailDomain !== smtpDomain && !smtpHost.includes(emailDomain)) {
                  console.warn(`⚠️ SPF WARNING: From email domain (${emailDomain}) doesn't match SMTP server domain (${smtpDomain}).`);
                  console.warn(`   This may cause SPF/DKIM failures. Consider using an email from ${smtpDomain} domain.`);
                  console.warn(`   Current EMAIL_USER: ${smtpUser}, SMTP_HOST: ${smtpHost}`);
                }
              }
            } else {
              throw new Error("No email configuration available. Please configure SMTP settings in .env file or tenant settings.");
            }
          }
        }
      }

      if (!transporter) {
        throw new Error("Failed to create email transporter");
      }

      // Determine reply-to email: use from database if available, otherwise use fromEmail
      let replyToEmail = fromEmail;
      // Use tenantConfig if we have it, otherwise try to get it
      const configForReply = tenantConfig || await this.getTenantEmailConfig(data.tenantId);
      if (configForReply?.reply_to_email && 
          configForReply.reply_to_email.trim() !== "" &&
          configForReply.reply_to_email.includes("@")) {
        replyToEmail = configForReply.reply_to_email;
        console.log(`📧 Using reply-to email from database: ${replyToEmail}`);
      } else {
        // Check if we have a reply-to in .env (could add SMTP_REPLY_TO_EMAIL in future)
        console.log(`📧 No reply-to email in database, using from email as reply-to: ${replyToEmail}`);
      }

      const mailOptions: any = {
        from: fromEmail,
        to: data.to,
        subject: data.subject,
        replyTo: replyToEmail,
      };

      // Use HTML if provided, otherwise use plain text
      if (data.htmlBody) {
        mailOptions.html = data.htmlBody;
        mailOptions.text = data.body; // Fallback for plain text clients
      } else {
        mailOptions.text = data.body;
      }

      // Log the complete mail options (excluding attachments content for brevity)
      console.log(`📧 Complete mail options:`, {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        replyTo: mailOptions.replyTo,
        hasHtml: !!mailOptions.html,
        hasText: !!mailOptions.text,
        textLength: mailOptions.text?.length || 0,
        htmlLength: mailOptions.html?.length || 0,
        attachmentCount: data.attachments?.length || 0,
      });

      // Add attachments if provided
      if (data.attachments && data.attachments.length > 0) {
        console.log(`📧 Processing ${data.attachments.length} attachment(s)...`);
        console.log(`📧 Raw attachment data:`, JSON.stringify(data.attachments.map(a => ({
          filename: a.filename,
          path: a.path,
          mimetype: a.mimetype,
          hasContent: !!a.content
        })), null, 2));
        
        const processedAttachments = [];
        
        for (const attachment of data.attachments) {
          try {
            console.log(`📧 Processing attachment:`, {
              filename: attachment.filename,
              path: attachment.path,
              mimetype: attachment.mimetype,
              hasContent: !!attachment.content
            });
            // If attachment has a URL (path), fetch it and convert to Buffer
            if (attachment.path && attachment.path.startsWith('http')) {
              console.log(`📧 Fetching attachment from URL: ${attachment.path}`);
              const response = await fetch(attachment.path);
              if (!response.ok) {
                console.error(`❌ Failed to fetch attachment from ${attachment.path}`);
                continue;
              }
              const buffer = Buffer.from(await response.arrayBuffer());
              processedAttachments.push({
                filename: attachment.filename || 'attachment',
                content: buffer,
                contentType: attachment.mimetype || response.headers.get('content-type') || undefined,
              });
            } else if (attachment.path && attachment.path.startsWith('/uploads/')) {
              // Local file path relative to project root - resolve to absolute path
              // Handle both /uploads/email-attachments/ and /uploads/ paths
              let filename = attachment.path;
              if (filename.includes('/email-attachments/')) {
                filename = filename.replace('/uploads/email-attachments/', '');
              } else {
                filename = filename.replace('/uploads/', '');
              }
              
              const absolutePath = path.join(process.cwd(), 'uploads', 'email-attachments', filename);
              
              console.log(`📧 Reading local attachment from: ${absolutePath}`);
              console.log(`📧 Original path: ${attachment.path}, Extracted filename: ${filename}`);
              
              // Check if file exists
              if (!fs.existsSync(absolutePath)) {
                console.error(`❌ Attachment file not found: ${absolutePath}`);
                console.error(`❌ Current working directory: ${process.cwd()}`);
                console.error(`❌ Attempted full path: ${absolutePath}`);
                // Try to list files in the directory to help debug
                const uploadsDir = path.join(process.cwd(), 'uploads', 'email-attachments');
                if (fs.existsSync(uploadsDir)) {
                  const files = fs.readdirSync(uploadsDir);
                  console.error(`❌ Files in uploads directory:`, files.slice(0, 10)); // Show first 10 files
                } else {
                  console.error(`❌ Uploads directory doesn't exist: ${uploadsDir}`);
                }
                continue;
              }
              
              // Read file and convert to Buffer
              const buffer = fs.readFileSync(absolutePath);
              console.log(`✅ File read successfully, size: ${buffer.length} bytes`);
              
              processedAttachments.push({
                filename: attachment.filename || filename || 'attachment',
                content: buffer,
                contentType: attachment.mimetype || undefined,
              });
              console.log(`✅ Successfully loaded local attachment: ${attachment.filename || filename}`);
            } else if (attachment.content) {
              // If attachment has base64 content, convert it
              const buffer = Buffer.from(attachment.content, 'base64');
              processedAttachments.push({
                filename: attachment.filename || 'attachment',
                content: buffer,
                contentType: attachment.mimetype || attachment.contentType || undefined,
              });
            } else if (attachment.path) {
              // Absolute file path (for development/testing)
              if (fs.existsSync(attachment.path)) {
                const buffer = fs.readFileSync(attachment.path);
                processedAttachments.push({
                  filename: attachment.filename || 'attachment',
                  content: buffer,
                  contentType: attachment.mimetype || undefined,
                });
              } else {
                console.error(`❌ Attachment file not found: ${attachment.path}`);
              }
            } else {
              console.warn(`⚠️ Invalid attachment format:`, attachment);
            }
          } catch (error: any) {
            console.error(`❌ Error processing attachment ${attachment.filename}:`, error);
            // Continue with other attachments even if one fails
          }
        }
        
        if (processedAttachments.length > 0) {
          mailOptions.attachments = processedAttachments;
          console.log(`✅ Processed ${processedAttachments.length} attachment(s) for email`);
          console.log(`📎 Attachment details:`, processedAttachments.map(a => ({
            filename: a.filename,
            contentType: a.contentType,
            size: a.content?.length || 'unknown'
          })));
        } else {
          console.error(`❌ CRITICAL: No valid attachments could be processed out of ${data.attachments.length} provided`);
          console.error(`❌ This may cause the email to fail or be rejected. Continuing anyway...`);
          // Don't throw error, but log it clearly - let the email send without attachments
        }
      }

      console.log(`📧 Attempting to send customer email to ${data.to} using ${emailSource}`);
      console.log(`📧 Email details: from=${fromEmail}, to=${data.to}, subject=${data.subject}`);

      // Test SMTP connection first
      try {
        await transporter.verify();
        console.log(`✅ SMTP connection verified for ${emailSource}`);
      } catch (verifyError: any) {
        console.error(`❌ SMTP verification failed for ${emailSource}:`, verifyError);
        console.error(`❌ SMTP Error details:`, {
          message: verifyError.message,
          code: verifyError.code,
          command: verifyError.command,
          response: verifyError.response,
          responseCode: verifyError.responseCode,
        });
        throw new Error(`SMTP connection failed: ${verifyError.message}`);
      }

      // Log final mail options before sending (including attachment count)
      console.log(`📧 Final mail options before sending:`, {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasAttachments: !!mailOptions.attachments && mailOptions.attachments.length > 0,
        attachmentCount: mailOptions.attachments?.length || 0,
        textLength: mailOptions.text?.length || 0,
        htmlLength: mailOptions.html?.length || 0,
      });
      
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Customer email sent successfully to ${data.to} using ${emailSource}`);
      console.log(`✅ Message ID: ${result.messageId}`);
      console.log(`✅ SMTP Response: ${result.response}`);
      console.log(`✅ Accepted recipients: ${result.accepted?.join(', ') || 'none'}`);
      console.log(`⚠️ Rejected recipients: ${result.rejected?.join(', ') || 'none'}`);
      console.log(`📧 Email envelope:`, result.envelope);
      
      if (result.rejected && result.rejected.length > 0) {
        console.error(`❌ Email was rejected by SMTP server for: ${result.rejected.join(', ')}`);
      }
      
      // Verify attachments were included
      if (data.attachments && data.attachments.length > 0) {
        const sentAttachmentCount = mailOptions.attachments?.length || 0;
        if (sentAttachmentCount === 0) {
          console.error(`❌ WARNING: Email was sent but NO attachments were included!`);
          console.error(`❌ Expected ${data.attachments.length} attachment(s) but 0 were processed`);
        } else if (sentAttachmentCount < data.attachments.length) {
          console.warn(`⚠️ WARNING: Only ${sentAttachmentCount} out of ${data.attachments.length} attachment(s) were included in the email`);
        } else {
          console.log(`✅ All ${sentAttachmentCount} attachment(s) were successfully included in the email`);
        }
      }
      
      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error(`❌ Error sending customer email to ${data.to}:`, error);
      console.error(`❌ Full error details:`, {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Send welcome email to a new lead
   */
  async sendLeadWelcomeEmail(data: {
    to: string;
    firstName: string;
    lastName: string;
    companyName: string;
    tenantId: number;
    leadId?: number;
    leadData?: any; // Optional: Lead data including source, phone, status, etc.
  }) {
    try {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      const subject = `Welcome to ${data.companyName} - Thank You for Your Interest!`;
      
      // Get lead-specific information if available
      const leadSource = data.leadData?.source || "our website";
      const leadPhone = data.leadData?.phone || "";
      const leadStatus = data.leadData?.status || "new";
      const leadNotes = data.leadData?.notes || "";
      const leadType = data.leadData?.leadTypeName || "";
      const leadBudget = data.leadData?.budgetRange || "";
      const leadCity = data.leadData?.city || "";
      const leadCountry = data.leadData?.country || "";
      
      // Build inquiry details section if lead data is available
      let inquiryDetailsHtml = "";
      if (data.leadData) {
        const details = [];
        if (leadType) details.push(`<strong>Inquiry Type:</strong> ${leadType}`);
        if (leadSource && leadSource !== "our website") details.push(`<strong>Source:</strong> ${leadSource}`);
        if (leadPhone) details.push(`<strong>Phone:</strong> ${leadPhone}`);
        if (leadCity || leadCountry) {
          const location = [leadCity, leadCountry].filter(Boolean).join(", ");
          if (location) details.push(`<strong>Location:</strong> ${location}`);
        }
        if (leadBudget) details.push(`<strong>Budget Range:</strong> ${leadBudget}`);
        
        if (details.length > 0) {
          inquiryDetailsHtml = `
            <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #007bff;">Your Inquiry Details:</p>
              <div style="color: #333;">
                ${details.map(detail => `<p style="margin: 5px 0;">${detail}</p>`).join("")}
              </div>
            </div>
          `;
        }
      }
      
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${data.companyName}!</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello ${data.firstName},</p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for your interest in <strong>${data.companyName}</strong>! We're excited to have you as a potential customer and look forward to helping you with your needs.
            </p>
            
            ${inquiryDetailsHtml}
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Our team has received your inquiry${leadSource && leadSource !== "our website" ? ` from ${leadSource}` : ""} and will be in touch with you shortly to discuss how we can help meet your needs.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0 0 15px 0; font-weight: bold; color: #333; font-size: 16px;">What's Next?</p>
              <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                <li>Our team will review your inquiry carefully</li>
                <li>We'll contact you within 24-48 hours${leadPhone ? ` at ${leadPhone}` : ""}</li>
                <li>We'll work together to find the best solution for you</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              In the meantime, if you have any questions or would like to speak with us directly, please don't hesitate to reach out.
            </p>
            
            <p style="color: #333; font-size: 14px; margin-top: 30px;">
              We look forward to serving you!
            </p>
            
            <p style="color: #333; font-size: 14px; margin-top: 20px;">
              Best regards,<br>
              <strong>The ${data.companyName} Team</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated message from ${data.companyName}. 
              If you have any questions, please contact us directly.
            </p>
          </div>
        </div>
      `;

      const textBody = `
Welcome to ${data.companyName}!

Hello ${data.firstName},

Thank you for your interest in ${data.companyName}! We're excited to have you as a potential customer and look forward to helping you with your needs.

${data.leadData ? `
Your Inquiry Details:
${leadType ? `Inquiry Type: ${leadType}` : ""}
${leadSource && leadSource !== "our website" ? `Source: ${leadSource}` : ""}
${leadPhone ? `Phone: ${leadPhone}` : ""}
${leadCity || leadCountry ? `Location: ${[leadCity, leadCountry].filter(Boolean).join(", ")}` : ""}
${leadBudget ? `Budget Range: ${leadBudget}` : ""}
` : ""}

Our team has received your inquiry${leadSource && leadSource !== "our website" ? ` from ${leadSource}` : ""} and will be in touch with you shortly to discuss how we can help meet your needs.

What's Next?
- Our team will review your inquiry carefully
- We'll contact you within 24-48 hours${leadPhone ? ` at ${leadPhone}` : ""}
- We'll work together to find the best solution for you

In the meantime, if you have any questions or would like to speak with us directly, please don't hesitate to reach out.

We look forward to serving you!

Best regards,
The ${data.companyName} Team

---
This is an automated message from ${data.companyName}. If you have any questions, please contact us directly.
      `;

      console.log(`📧 Preparing to send lead welcome email:`);
      console.log(`   - To: ${data.to}`);
      console.log(`   - Company Name: ${data.companyName}`);
      console.log(`   - From Name: ${data.companyName}`);
      console.log(`   - Tenant ID: ${data.tenantId}`);
      
      await this.sendCustomerEmail({
        to: data.to,
        subject: subject,
        body: textBody,
        htmlBody: htmlBody,
        tenantId: data.tenantId,
        fromName: data.companyName, // Use tenant company name as "from" name
      });

      console.log(`✅ Lead welcome email sent to ${data.to} from ${data.companyName}`);
    } catch (error: any) {
      console.error(`❌ Error sending lead welcome email to ${data.to}:`, error);
      // Don't throw - email failure shouldn't break lead creation
    }
  }

  /**
   * Send welcome email to a new customer
   */
  async sendCustomerWelcomeEmail(data: {
    to: string;
    firstName: string;
    lastName: string;
    companyName: string;
    tenantId: number;
    customerId?: number;
  }) {
    try {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      const subject = `Congratulations! You're Now a Customer of ${data.companyName}`;
      
      // Use the same professional template as lead conversion email
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Congratulations, ${data.firstName}!</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello ${data.firstName},</p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              We're excited to inform you that you're now officially a customer of <strong>${data.companyName}</strong>!
            </p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              This is an important milestone, and we're honored that you've chosen to work with us. Our team is committed to ensuring you receive the best possible service and support.
            </p>
            
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196F3;">
              <p style="margin: 0 0 15px 0; font-weight: bold; color: #2196F3; font-size: 16px;">What This Means for You:</p>
              <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
                <li>You now have full customer status with ${data.companyName}</li>
                <li>Access to dedicated customer support</li>
                <li>Priority handling of your requests</li>
                <li>Exclusive customer benefits and updates</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Our team will be in touch with you soon to discuss next steps and ensure everything is set up perfectly for you.
            </p>
            
            <p style="color: #333; font-size: 14px; margin-top: 30px;">
              Thank you for your trust in ${data.companyName}. We look forward to serving you!
            </p>
            
            <p style="color: #333; font-size: 14px; margin-top: 20px;">
              Best regards,<br>
              <strong>The ${data.companyName} Team</strong>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated message from ${data.companyName}. 
              If you have any questions, please contact us directly.
            </p>
          </div>
        </div>
      `;

      const textBody = `
Congratulations, ${data.firstName}!

Hello ${data.firstName},

We're excited to inform you that you're now officially a customer of ${data.companyName}!

This is an important milestone, and we're honored that you've chosen to work with us. Our team is committed to ensuring you receive the best possible service and support.

What This Means for You:
- You now have full customer status with ${data.companyName}
- Access to dedicated customer support
- Priority handling of your requests
- Exclusive customer benefits and updates

Our team will be in touch with you soon to discuss next steps and ensure everything is set up perfectly for you.

Thank you for your trust in ${data.companyName}. We look forward to serving you!

Best regards,
The ${data.companyName} Team

---
This is an automated message from ${data.companyName}. If you have any questions, please contact us directly.
      `;

      console.log(`📧 Preparing to send customer welcome email:`);
      console.log(`   - To: ${data.to}`);
      console.log(`   - Company Name: ${data.companyName}`);
      console.log(`   - From Name: ${data.companyName}`);
      console.log(`   - Tenant ID: ${data.tenantId}`);
      
      await this.sendCustomerEmail({
        to: data.to,
        subject: subject,
        body: textBody,
        htmlBody: htmlBody,
        tenantId: data.tenantId,
        fromName: data.companyName, // Use tenant company name as "from" name
      });

      console.log(`✅ Customer welcome email sent to ${data.to} from ${data.companyName}`);
    } catch (error: any) {
      console.error(`❌ Error sending customer welcome email to ${data.to}:`, error);
      // Don't throw - email failure shouldn't break customer creation
    }
  }

  /**
   * Send conversion email when lead becomes a customer
   */
  async sendLeadConversionEmail(data: {
    to: string;
    firstName: string;
    lastName: string;
    companyName: string;
    tenantId: number;
    leadId?: number;
    customerId?: number;
  }) {
    try {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      const subject = `Congratulations! You're Now a Customer of ${data.companyName}`;
      
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2196F3; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: white; margin-top: 0;">Congratulations, ${data.firstName}!</h2>
          </div>
          
          <p>Hello ${data.firstName},</p>
          
          <p>We're excited to inform you that your inquiry has been successfully converted, and you're now officially a customer of ${data.companyName}!</p>
          
          <p>This is an important milestone, and we're honored that you've chosen to work with us. Our team is committed to ensuring you receive the best possible service and support.</p>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
            <p style="margin: 0;"><strong>What This Means for You:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>You now have full customer status with ${data.companyName}</li>
              <li>Access to dedicated customer support</li>
              <li>Priority handling of your requests</li>
              <li>Exclusive customer benefits and updates</li>
            </ul>
          </div>
          
          <p>Our team will be in touch with you soon to discuss next steps and ensure everything is set up perfectly for you.</p>
          
          <p>Thank you for your trust in ${data.companyName}. We're looking forward to a successful partnership!</p>
          
          <p>Best regards,<br>
          <strong>The ${data.companyName} Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message from ${data.companyName}. 
            If you have any questions, please contact us directly.
          </p>
        </div>
      `;

      const textBody = `
Congratulations, ${data.firstName}!

Hello ${data.firstName},

We're excited to inform you that your inquiry has been successfully converted, and you're now officially a customer of ${data.companyName}!

This is an important milestone, and we're honored that you've chosen to work with us. Our team is committed to ensuring you receive the best possible service and support.

What This Means for You:
- You now have full customer status with ${data.companyName}
- Access to dedicated customer support
- Priority handling of your requests
- Exclusive customer benefits and updates

Our team will be in touch with you soon to discuss next steps and ensure everything is set up perfectly for you.

Thank you for your trust in ${data.companyName}. We're looking forward to a successful partnership!

Best regards,
The ${data.companyName} Team

---
This is an automated message from ${data.companyName}. If you have any questions, please contact us directly.
      `;

      console.log(`📧 Preparing to send lead conversion email:`);
      console.log(`   - To: ${data.to}`);
      console.log(`   - Company Name: ${data.companyName}`);
      console.log(`   - From Name: ${data.companyName}`);
      console.log(`   - Tenant ID: ${data.tenantId}`);
      
      await this.sendCustomerEmail({
        to: data.to,
        subject: subject,
        body: textBody,
        htmlBody: htmlBody,
        tenantId: data.tenantId,
        fromName: data.companyName, // Use tenant company name as "from" name
      });

      console.log(`✅ Lead conversion email sent to ${data.to} from ${data.companyName}`);
    } catch (error: any) {
      console.error(`❌ Error sending lead conversion email to ${data.to}:`, error);
      // Don't throw - email failure shouldn't break conversion
    }
  }

  /**
   * Send package email with PDF attachment
   */
  async sendPackageEmail(data: {
    tenantId: number;
    to: string;
    recipientName: string;
    package: any;
    companyName: string;
    publicUrl: string;
    customMessage?: string;
    htmlBody: string;
    pdfBuffer?: Buffer | null;
  }): Promise<boolean> {
    try {
      // Get tenant email configuration
      const tenantConfig = await this.getTenantEmailConfig(data.tenantId);
      let transporter: nodemailer.Transporter | null = null;
      let fromEmail = process.env.EMAIL_FROM || "noreply@ratehonk.com";

      if (tenantConfig) {
        transporter = this.createTenantTransporter(tenantConfig);
        fromEmail = tenantConfig.sender_email || tenantConfig.smtp_username;
      } else {
        // Fallback to SaaS owner config
        const saasConfig = await this.getSaasOwnerEmailConfig();
        if (saasConfig) {
          transporter = this.createTenantTransporter(saasConfig);
          fromEmail = saasConfig.sender_email || saasConfig.smtp_username;
        } else {
          throw new Error("No email configuration available");
        }
      }

      if (!transporter) {
        throw new Error("Failed to create email transporter");
      }

      const subject = `${data.package.name} - Travel Package from ${data.companyName}`;

      const mailOptions: any = {
        from: fromEmail,
        to: data.to,
        subject,
        html: data.htmlBody,
      };

      // Add PDF attachment if available
      if (data.pdfBuffer) {
        mailOptions.attachments = [
          {
            filename: `package-${data.package.name.replace(/[^a-z0-9]/gi, '_')}.pdf`,
            content: data.pdfBuffer,
            contentType: "application/pdf",
          },
        ];
      }

      await transporter.sendMail(mailOptions);
      console.log(`✅ Package email sent to ${data.to} for package ${data.package.name}`);
      return true;
    } catch (error: any) {
      console.error("Error sending package email:", error);
      return false;
    }
  }

  /**
   * Send follow-up assignment email on behalf of tenant company
   */
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
    previousUserName?: string;
    isReassignment?: boolean;
    companyName?: string;
  }) {
    try {
      // Get tenant company name
      let companyName = data.companyName;
      if (!companyName) {
        const [tenant] = await sql`
          SELECT company_name FROM tenants WHERE id = ${data.tenantId}
        `;
        companyName = tenant?.company_name || "Your Company";
      }

      const baseUrl = process.env.APP_URL || "http://localhost:5000";
      const followUpUrl = `${baseUrl}/follow-ups`;

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

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
            <h2 style="color: white; margin: 0;">${data.isReassignment ? 'Follow-Up Reassigned' : 'New Follow-Up Assigned'}</h2>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; padding: 20px;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${data.assignedUserName}</strong>,</p>
            <p style="color: #666;">
              ${data.isReassignment && data.previousUserName 
                ? `A follow-up has been moved from ${data.previousUserName} to you.` 
                : 'A new follow-up has been assigned to you.'}
            </p>
            ${data.isReassignment && data.previousUserName ? `
            <div style="background-color: #fff3cd; padding: 12px; border-radius: 4px; border-left: 4px solid #ffc107; margin: 15px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Note:</strong> This follow-up was previously assigned to ${data.previousUserName} and has now been reassigned to you.
              </p>
            </div>
            ` : ''}
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
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
              <a href="${followUpUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Follow-Up in Dashboard
              </a>
            </div>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
            <p style="margin: 0 0 8px;">
              Best regards,<br>
              <strong>The ${companyName} Team</strong>
            </p>
            <p style="margin: 8px 0 0; color: #999;">
              This is an automated notification from ${companyName}.
            </p>
          </div>
        </body>
        </html>
      `;

      const textBody = `
${data.isReassignment ? 'Follow-Up Reassigned' : 'New Follow-Up Assigned'}

Hello ${data.assignedUserName},

${data.isReassignment && data.previousUserName 
  ? `A follow-up has been moved from ${data.previousUserName} to you.` 
  : 'A new follow-up has been assigned to you.'}

${data.isReassignment && data.previousUserName ? `
Note: This follow-up was previously assigned to ${data.previousUserName} and has now been reassigned to you.
` : ''}

Follow-Up Details:
Title: ${data.followUpTitle}
${data.followUpDescription ? `Description: ${data.followUpDescription}\n` : ''}
Due Date: ${new Date(data.dueDate).toLocaleString()}
Priority: ${data.priority.toUpperCase()}
Assigned By: ${data.createdByName}
${data.relatedEntityType && data.relatedEntityId && data.relatedEntityName ? `Related To: ${data.relatedEntityType} - ${data.relatedEntityName}\n` : ''}

View Follow-Up: ${followUpUrl}

Best regards,
The ${companyName} Team

---
This is an automated notification from ${companyName}.
      `;

      const subject = data.isReassignment 
        ? `Follow-Up Reassigned: ${data.followUpTitle}`
        : `New Follow-Up Assigned: ${data.followUpTitle}`;

      console.log(`📧 Preparing to send follow-up assignment email on behalf of ${companyName}:`);
      console.log(`   - To: ${data.to}`);
      console.log(`   - Follow-Up Title: ${data.followUpTitle}`);
      console.log(`   - Tenant ID: ${data.tenantId}`);

      await this.sendCustomerEmail({
        to: data.to,
        subject: subject,
        body: textBody,
        htmlBody: htmlBody,
        tenantId: data.tenantId,
        fromName: companyName,
      });

      console.log(`✅ Follow-up assignment email sent to ${data.to} from ${companyName}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error sending follow-up assignment email to ${data.to}:`, error);
      return false;
    }
  }

  /**
   * Send follow-up priority change email on behalf of tenant company
   */
  async sendFollowUpPriorityChangeEmail(data: {
    to: string;
    assignedUserName: string;
    createdByName: string;
    followUpTitle: string;
    followUpDescription?: string;
    dueDate: string;
    previousPriority: string;
    newPriority: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
    relatedEntityName?: string;
    followUpId: number;
    tenantId: number;
    companyName?: string;
  }) {
    try {
      // Get tenant company name
      let companyName = data.companyName;
      if (!companyName) {
        const [tenant] = await sql`
          SELECT company_name FROM tenants WHERE id = ${data.tenantId}
        `;
        companyName = tenant?.company_name || "Your Company";
      }

      const baseUrl = process.env.APP_URL || "http://localhost:5000";
      const followUpUrl = `${baseUrl}/follow-ups`;

      const priorityColors: Record<string, string> = {
        low: '#6B7280',
        medium: '#3B82F6',
        high: '#F59E0B',
        urgent: '#EF4444'
      };
      const previousPriorityColor = priorityColors[data.previousPriority] || '#3B82F6';
      const newPriorityColor = priorityColors[data.newPriority] || '#3B82F6';

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

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
            <h2 style="color: white; margin: 0;">Follow-Up Priority Changed</h2>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; padding: 20px;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${data.assignedUserName}</strong>,</p>
            <p style="color: #666;">
              The priority of a follow-up assigned to you has been updated.
            </p>
            
            <div style="background-color: #fff3cd; padding: 12px; border-radius: 4px; border-left: 4px solid #ffc107; margin: 15px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Priority Change:</strong> 
                <span style="background-color: ${previousPriorityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase; margin: 0 5px;">
                  ${data.previousPriority}
                </span>
                →
                <span style="background-color: ${newPriorityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase; margin: 0 5px;">
                  ${data.newPriority}
                </span>
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
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
                    <strong>Current Priority:</strong> 
                    <span style="background-color: ${newPriorityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
                      ${data.newPriority}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong>Changed By:</strong> ${data.createdByName}
                  </td>
                </tr>
                ${relatedEntitySection}
              </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${followUpUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View Follow-Up in Dashboard
              </a>
            </div>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
            <p style="margin: 0 0 8px;">
              Best regards,<br>
              <strong>The ${companyName} Team</strong>
            </p>
            <p style="margin: 8px 0 0; color: #999;">
              This is an automated notification from ${companyName}.
            </p>
          </div>
        </body>
        </html>
      `;

      const textBody = `
Follow-Up Priority Changed

Hello ${data.assignedUserName},

The priority of a follow-up assigned to you has been updated.

Priority Change: ${data.previousPriority.toUpperCase()} → ${data.newPriority.toUpperCase()}

Follow-Up Details:
Title: ${data.followUpTitle}
${data.followUpDescription ? `Description: ${data.followUpDescription}\n` : ''}
Due Date: ${new Date(data.dueDate).toLocaleString()}
Current Priority: ${data.newPriority.toUpperCase()}
Changed By: ${data.createdByName}
${data.relatedEntityType && data.relatedEntityId && data.relatedEntityName ? `Related To: ${data.relatedEntityType} - ${data.relatedEntityName}\n` : ''}

View Follow-Up: ${followUpUrl}

Best regards,
The ${companyName} Team

---
This is an automated notification from ${companyName}.
      `;

      const subject = `Follow-Up Priority Changed: ${data.followUpTitle}`;

      console.log(`📧 Preparing to send follow-up priority change email on behalf of ${companyName}:`);
      console.log(`   - To: ${data.to}`);
      console.log(`   - Follow-Up Title: ${data.followUpTitle}`);
      console.log(`   - Priority: ${data.previousPriority} → ${data.newPriority}`);
      console.log(`   - Tenant ID: ${data.tenantId}`);

      await this.sendCustomerEmail({
        to: data.to,
        subject: subject,
        body: textBody,
        htmlBody: htmlBody,
        tenantId: data.tenantId,
        fromName: companyName,
      });

      console.log(`✅ Follow-up priority change email sent to ${data.to} from ${companyName}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error sending follow-up priority change email to ${data.to}:`, error);
      return false;
    }
  }
}

export const tenantEmailService = new TenantEmailService();
