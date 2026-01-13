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
      // Get SaaS owner email configuration - try multiple approaches to find admin config
      let [config] = await sql`
        SELECT * FROM email_configurations 
        WHERE tenant_id = 1 AND is_active = true AND is_smtp_enabled = true
        LIMIT 1
      `;

      // If no config for tenant_id = 1, try to find the first available SaaS admin config
      if (!config) {
        [config] = await sql`
          SELECT * FROM email_configurations 
          WHERE is_active = true AND is_smtp_enabled = true
          ORDER BY tenant_id ASC
          LIMIT 1
        `;
        if (config) {
          console.log(
            `📧 No SaaS owner config found for tenant_id=1, using tenant ${config.tenant_id} as fallback: host=${config.smtp_host}, user=${config.smtp_username}`,
          );
        } else {
          console.log(`📧 No SaaS owner SMTP config found (no active enabled configs in database)`);
        }
      } else {
        console.log(`📧 Found SaaS owner SMTP config: host=${config.smtp_host}, user=${config.smtp_username}`);
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
    const transportConfig: any = {
      host: config.smtp_host,
      port: config.smtp_port || 587,
      secure: config.smtp_security === "ssl",
      auth: {
        user: config.smtp_username,
        pass: config.smtp_password,
      },
    };

    if (config.smtp_security === "tls") {
      transportConfig.secure = false;
      transportConfig.requireTLS = true;
    }

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
            });
            fromEmail = smtpConfig.fromEmail;
            emailSource = "environment variables (config)";
            console.log(
              `📧 Using environment SMTP from config for ${data.companyName} (no configured SMTP found)`,
            );
            console.log(`📧 SMTP Config: host=${smtpConfig.host}, port=${smtpConfig.port}, user=${smtpConfig.user}`);
          } else {
            // Final fallback: Try legacy environment variables
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
              transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || "mail.vanitechnologies.in",
                port: parseInt(process.env.EMAIL_PORT || "587"),
                secure: process.env.EMAIL_SECURE === "true",
                auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS,
                },
              });
              fromEmail = process.env.EMAIL_FROM || "noreply@ratehonk.com";
              emailSource = "environment variables (legacy)";
              console.log(`📧 Using legacy environment SMTP for ${data.companyName}`);
            } else {
              throw new Error("No email configuration available. Please configure SMTP settings in .env file or tenant settings.");
            }
          }
        }
      }

      if (!transporter) {
        throw new Error("Failed to create email transporter");
      }

      const mailOptions = {
        from: fromEmail,
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
        subject: "Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            
            <p>Hello ${data.firstName},</p>
            
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

  async sendCustomerEmail(data: {
    to: string;
    subject: string;
    body: string;
    htmlBody?: string;
    tenantId: number;
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
          // Format: "Sender Name <email@example.com>" if sender_name exists, otherwise just email
          if (tenantConfig.sender_name && tenantConfig.sender_name.trim() !== "") {
            fromEmail = `"${tenantConfig.sender_name}" <${tenantConfig.sender_email}>`;
          } else {
            fromEmail = tenantConfig.sender_email;
          }
          console.log(`📧 Using sender info from database (email-settings): ${fromEmail}`);
          
          // Warn if sender_email doesn't match SMTP username (can cause delivery issues)
          if (tenantConfig.smtp_username && !tenantConfig.sender_email.toLowerCase().includes(tenantConfig.smtp_username.toLowerCase())) {
            console.warn(`⚠️ WARNING: Sender email (${tenantConfig.sender_email}) doesn't match SMTP username (${tenantConfig.smtp_username}). This may cause delivery issues.`);
          }
        } else {
          // Fall back to .env default sender email
          const smtpConfig = config.email.smtp;
          if (smtpConfig.fromEmail) {
            if (smtpConfig.fromName) {
              fromEmail = `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`;
            } else {
              fromEmail = smtpConfig.fromEmail;
            }
            console.log(`📧 No valid sender_email in database, using .env default: ${fromEmail}`);
            
            // Warn if .env fromEmail doesn't match SMTP username
            if (tenantConfig.smtp_username && !smtpConfig.fromEmail.toLowerCase().includes(tenantConfig.smtp_username.toLowerCase())) {
              console.warn(`⚠️ WARNING: .env SMTP_FROM_EMAIL (${smtpConfig.fromEmail}) doesn't match SMTP username (${tenantConfig.smtp_username}). Using SMTP username as from email instead.`);
              // Use SMTP username as from email to ensure delivery
              fromEmail = tenantConfig.smtp_username;
              console.log(`📧 Using SMTP username as from email: ${fromEmail}`);
            }
          } else {
            // Last resort: use smtp_username
            fromEmail = tenantConfig.smtp_username;
            console.log(`⚠️ No sender_email in database and no .env SMTP_FROM_EMAIL, using smtp_username: ${fromEmail}`);
          }
        }
        emailSource = "tenant SMTP";
        console.log(`📧 Using tenant-specific SMTP for customer email`);
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
            // Format: "Sender Name <email@example.com>" if sender_name exists, otherwise just email
            if (saasOwnerConfig.sender_name && saasOwnerConfig.sender_name.trim() !== "") {
              fromEmail = `"${saasOwnerConfig.sender_name}" <${saasOwnerConfig.sender_email}>`;
            } else {
              fromEmail = saasOwnerConfig.sender_email;
            }
            console.log(`📧 Using SaaS owner sender info from database: ${fromEmail}`);
          } else {
            // Fall back to .env default sender email
            const smtpConfig = config.email.smtp;
            if (smtpConfig.fromEmail) {
              if (smtpConfig.fromName) {
                fromEmail = `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`;
              } else {
                fromEmail = smtpConfig.fromEmail;
              }
              console.log(`📧 No valid SaaS owner sender_email in database, using .env default: ${fromEmail}`);
            } else {
              // Last resort: use smtp_username
              fromEmail = saasOwnerConfig.smtp_username;
              console.log(`⚠️ No sender_email in database and no .env SMTP_FROM_EMAIL, using smtp_username: ${fromEmail}`);
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
            });
            // Use .env default sender info
            if (smtpConfig.fromEmail) {
              if (smtpConfig.fromName) {
                fromEmail = `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`;
              } else {
                fromEmail = smtpConfig.fromEmail;
              }
            } else {
              fromEmail = smtpConfig.user; // Fallback to SMTP user
            }
            emailSource = "environment variables (config)";
            console.log(`📧 Using environment SMTP from config for customer email (no configured SMTP found)`);
            console.log(`📧 SMTP Config: host=${smtpConfig.host}, port=${smtpConfig.port}, user=${smtpConfig.user}`);
            console.log(`📧 Sender email: ${fromEmail} (from .env SMTP_FROM_EMAIL and SMTP_FROM_NAME)`);
          } else {
            // Final fallback: Try legacy environment variables
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
              transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || "mail.vanitechnologies.in",
                port: parseInt(process.env.EMAIL_PORT || "587"),
                secure: process.env.EMAIL_SECURE === "true",
                auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS,
                },
              });
              fromEmail = process.env.EMAIL_FROM || "noreply@ratehonk.com";
              emailSource = "environment variables (legacy)";
              console.log(`📧 Using legacy environment SMTP for customer email`);
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
  }) {
    try {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      const subject = `Welcome to ${data.companyName} - Thank You for Your Interest!`;
      
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to ${data.companyName}!</h2>
          </div>
          
          <p>Hello ${data.firstName},</p>
          
          <p>Thank you for your interest in ${data.companyName}. We're excited to have you as a potential customer!</p>
          
          <p>Our team has received your inquiry and will be in touch with you shortly to discuss how we can help meet your needs.</p>
          
          <p>In the meantime, if you have any questions or would like to speak with us directly, please don't hesitate to reach out.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>What's Next?</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Our team will review your inquiry</li>
              <li>We'll contact you within 24-48 hours</li>
              <li>We'll work together to find the best solution for you</li>
            </ul>
          </div>
          
          <p>We look forward to serving you!</p>
          
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
Welcome to ${data.companyName}!

Hello ${data.firstName},

Thank you for your interest in ${data.companyName}. We're excited to have you as a potential customer!

Our team has received your inquiry and will be in touch with you shortly to discuss how we can help meet your needs.

In the meantime, if you have any questions or would like to speak with us directly, please don't hesitate to reach out.

What's Next?
- Our team will review your inquiry
- We'll contact you within 24-48 hours
- We'll work together to find the best solution for you

We look forward to serving you!

Best regards,
The ${data.companyName} Team

---
This is an automated message from ${data.companyName}. If you have any questions, please contact us directly.
      `;

      await this.sendCustomerEmail({
        to: data.to,
        subject: subject,
        body: textBody,
        htmlBody: htmlBody,
        tenantId: data.tenantId,
      });

      console.log(`✅ Lead welcome email sent to ${data.to}`);
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
      const subject = `Welcome to ${data.companyName} - You're Now a Valued Customer!`;
      
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: white; margin-top: 0;">Welcome to ${data.companyName}!</h2>
          </div>
          
          <p>Hello ${data.firstName},</p>
          
          <p>We're thrilled to welcome you as a valued customer of ${data.companyName}!</p>
          
          <p>Your account has been set up and you're now part of our customer family. We're committed to providing you with exceptional service and support.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>What You Can Expect:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Dedicated support from our team</li>
              <li>Regular updates on your account</li>
              <li>Access to exclusive customer benefits</li>
              <li>Priority assistance when you need it</li>
            </ul>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to reach out to us. We're here to help!</p>
          
          <p>Thank you for choosing ${data.companyName}. We look forward to a long and successful partnership!</p>
          
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
Welcome to ${data.companyName}!

Hello ${data.firstName},

We're thrilled to welcome you as a valued customer of ${data.companyName}!

Your account has been set up and you're now part of our customer family. We're committed to providing you with exceptional service and support.

What You Can Expect:
- Dedicated support from our team
- Regular updates on your account
- Access to exclusive customer benefits
- Priority assistance when you need it

If you have any questions or need assistance, please don't hesitate to reach out to us. We're here to help!

Thank you for choosing ${data.companyName}. We look forward to a long and successful partnership!

Best regards,
The ${data.companyName} Team

---
This is an automated message from ${data.companyName}. If you have any questions, please contact us directly.
      `;

      await this.sendCustomerEmail({
        to: data.to,
        subject: subject,
        body: textBody,
        htmlBody: htmlBody,
        tenantId: data.tenantId,
      });

      console.log(`✅ Customer welcome email sent to ${data.to}`);
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

      await this.sendCustomerEmail({
        to: data.to,
        subject: subject,
        body: textBody,
        htmlBody: htmlBody,
        tenantId: data.tenantId,
      });

      console.log(`✅ Lead conversion email sent to ${data.to}`);
    } catch (error: any) {
      console.error(`❌ Error sending lead conversion email to ${data.to}:`, error);
      // Don't throw - email failure shouldn't break conversion
    }
  }
}

export const tenantEmailService = new TenantEmailService();
