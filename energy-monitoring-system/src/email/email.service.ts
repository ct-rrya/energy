import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * EmailService
 *
 * Handles email sending for the EcoStep system using Resend.
 *
 * Features:
 * - Send access code emails to administrators
 * - Configurable via environment variables
 * - Graceful fallback when email is not configured
 * - HTML email templates
 *
 * Configuration (via .env):
 * - RESEND_API_KEY: Your Resend API key (required)
 * - EMAIL_FROM: Verified sender email address (required)
 * - EMAIL_FROM_NAME: Sender display name (optional)
 *
 * Resend Setup:
 * 1. Sign up at https://resend.com
 * 2. Get your API key from dashboard
 * 3. Verify your domain or email address
 * 4. Add RESEND_API_KEY and EMAIL_FROM to .env
 *
 * Example .env configuration:
 * RESEND_API_KEY=re_abc123...
 * EMAIL_FROM=noreply@yourdomain.com
 * EMAIL_FROM_NAME=EcoStep System
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private isConfigured = false;
  private fromEmail: string | null = null;
  private fromName: string | null = null;

  constructor(private configService: ConfigService) {
    this.initializeResend();
  }

  /**
   * Initialize Resend client
   *
   * Creates Resend client if email is configured.
   * Logs warning if email is not configured.
   */
  private initializeResend(): void {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const fromEmail = this.configService.get<string>('EMAIL_FROM');

    // Check if email is configured
    if (!apiKey || !fromEmail) {
      this.logger.warn(
        'Email service not configured. Administrator access codes will not be sent via email. ' +
          'Configure RESEND_API_KEY and EMAIL_FROM in .env to enable email delivery.',
      );
      this.isConfigured = false;
      return;
    }

    // Create Resend client
    try {
      this.resend = new Resend(apiKey);
      this.fromEmail = fromEmail;
      this.fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'EcoStep System';
      this.isConfigured = true;
      
      this.logger.log(`Email service initialized with Resend (from: ${fromEmail})`);
    } catch (error) {
      this.logger.error(
        `Failed to initialize email service: ${error.message}`,
        error.stack,
      );
      this.isConfigured = false;
    }
  }

  /**
   * Send administrator access code email
   *
   * @param email - Recipient email address
   * @param name - Administrator name
   * @param accessCode - Plain text access code
   * @param isReset - Whether this is a code reset (default: false)
   * @returns Promise<boolean> - true if email sent successfully
   *
   * Process:
   * 1. Check if email is configured
   * 2. Generate HTML email template
   * 3. Send email via Resend
   * 4. Log result
   *
   * Security:
   * - Access code is sent only to the registered email address
   * - Email uses TLS encryption (Resend handles this)
   * - Access code is not logged
   *
   * Usage:
   *   const sent = await emailService.sendAccessCodeEmail(
   *     'john@example.com',
   *     'John Doe',
   *     'xY7pQ3mN9kL2'
   *   );
   */
  async sendAccessCodeEmail(
    email: string,
    name: string,
    accessCode: string,
    isReset = false,
  ): Promise<boolean> {
    // Check if email is configured
    if (!this.isConfigured || !this.resend) {
      this.logger.warn(`Cannot send access code email to ${email}: Email service not configured`);
      return false;
    }

    try {
      // Generate email subject
      const subject = isReset
        ? 'EcoStep Administrator Access Code Reset'
        : 'EcoStep Administrator Access Code';

      // Generate email HTML
      const html = this.generateAccessCodeEmailHtml(
        name,
        accessCode,
        isReset,
      );

      // Send email via Resend
      // The Resend SDK returns { data, error } - we must check both
      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [email],
        subject,
        html,
      });

      // Check if Resend returned an error
      if (result.error) {
        this.logger.error(
          `Resend API error sending email to ${email}: ${result.error.message || JSON.stringify(result.error)}`,
        );
        return false;
      }

      // Success - log the message ID if available
      this.logger.log(
        `Access code email sent successfully to ${email} (${isReset ? 'reset' : 'new account'})${result.data?.id ? ` - Message ID: ${result.data.id}` : ''}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send access code email to ${email}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Generate HTML template for access code email
   *
   * @param name - Administrator name
   * @param accessCode - Plain text access code
   * @param isReset - Whether this is a code reset
   * @returns HTML string
   *
   * Security:
   * - Access code is displayed prominently
   * - Warning about keeping code confidential
   * - Professional appearance
   */
  private generateAccessCodeEmailHtml(
    name: string,
    accessCode: string,
    isReset: boolean,
  ): string {
    const greeting = isReset
      ? 'Your EcoStep administrator access code has been reset.'
      : 'Your EcoStep System Administrator account has been created.';

    // Format access code with dashes: ABC-123-DEF-456
    const formattedCode = this.formatAccessCode(accessCode);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoStep Administrator Access Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #0B132B 0%, #1C2541 100%); border-radius: 8px; margin-bottom: 20px;">
                <h1 style="color: #39FF88; margin: 0; font-size: 24px; font-weight: 600;">
                    🌱 EcoStep
                </h1>
            </div>
        </div>

        <!-- Body -->
        <div style="margin-bottom: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">${greeting}</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Your personal Administrator Access Code is:</p>
            
            <!-- Access Code Display -->
            <div style="background-color: #f8f9fa; border: 2px solid #39FF88; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <div style="font-size: 28px; font-weight: bold; letter-spacing: 3px; color: #0B132B; font-family: 'Courier New', monospace;">
                    ${formattedCode}
                </div>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 15px;">Use this code to access the EcoStep monitoring system at:</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
                <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'}/admin/login" 
                   style="color: #39FF88; text-decoration: none; font-weight: 600;">
                    ${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'}/admin/login
                </a>
            </p>
        </div>

        <!-- Security Notice -->
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⚠️ Security Notice:</strong><br>
                Please keep this access code confidential and do not share it with others. 
                This code identifies you personally in the system and all your actions are logged.
            </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">
                EcoStep Energy Monitoring System
            </p>
            <p style="margin: 0; font-size: 12px; color: #999;">
                This is an automated email. Please do not reply to this message.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Format access code with dashes for readability
   * 
   * Converts: "ABC123DEF456" → "ABC-123-DEF-456"
   * Pattern: 3 chars - 3 chars - 3 chars - 3 chars
   * 
   * @param accessCode - 12-character access code
   * @returns Formatted access code with dashes
   */
  private formatAccessCode(accessCode: string): string {
    if (accessCode.length !== 12) {
      this.logger.warn(`Access code length is ${accessCode.length}, expected 12. Returning unformatted.`);
      return accessCode;
    }
    
    // Split into 4 groups of 3 characters
    return `${accessCode.slice(0, 3)}-${accessCode.slice(3, 6)}-${accessCode.slice(6, 9)}-${accessCode.slice(9, 12)}`;
  }

  /**
   * Send an automated tile health / anomaly alert email to active admins.
   * Gracefully no-ops when Resend is not configured so in-app alerts still work.
   */
  async sendHealthAlertEmail(
    recipients: string[],
    payload: {
      title: string;
      description: string;
      severity: 'info' | 'warning' | 'critical';
      recommendedAction?: string;
      metrics?: Array<{ label: string; value: string }>;
      detectedAt?: Date;
    },
  ): Promise<{ sent: number; failed: number; skipped: boolean }> {
    const cleanRecipients = Array.from(
      new Set(
        (recipients || [])
          .map((e) => (e || '').trim().toLowerCase())
          .filter((e) => e.includes('@')),
      ),
    );

    if (!this.isConfigured || !this.resend || cleanRecipients.length === 0) {
      if (!this.isConfigured) {
        this.logger.debug('Skipping health alert email: Resend is not configured');
      }
      return { sent: 0, failed: 0, skipped: true };
    }

    const severityLabel =
      payload.severity === 'critical'
        ? 'CRITICAL'
        : payload.severity === 'warning'
          ? 'WARNING'
          : 'INFO';
    const badgeColor =
      payload.severity === 'critical'
        ? '#dc2626'
        : payload.severity === 'warning'
          ? '#d97706'
          : '#0284c7';
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('CORS_ORIGIN')?.split(',')[0]?.trim() ||
      '';
    const detectedStr = (payload.detectedAt || new Date()).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const metricsHtml =
      payload.metrics && payload.metrics.length > 0
        ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
            ${payload.metrics
              .map(
                (m) =>
                  `<tr>
                    <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;">${this.escapeHtml(m.label)}</td>
                    <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:#111827;text-align:right;font-weight:600;">${this.escapeHtml(m.value)}</td>
                  </tr>`,
              )
              .join('')}
           </table>`
        : '';

    const actionHtml = payload.recommendedAction
      ? `<div style="background:#f0fdf4;border-left:4px solid #19d46a;padding:12px 14px;border-radius:4px;margin:16px 0;font-size:13.5px;color:#14532d;">
          <strong>Recommended Next Step:</strong><br/>
          ${this.escapeHtml(payload.recommendedAction)}
         </div>`
      : '';

    const linkHtml = frontendUrl
      ? `<p style="margin:20px 0 0 0;">
          <a href="${frontendUrl.replace(/\/$/, '')}/diagnostics" style="display:inline-block;background:#19d46a;color:#0d1b14;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px;font-size:13.5px;">Open Tile Diagnostics</a>
         </p>`
      : '';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f4f7f5;margin:0;padding:20px;color:#1f2937;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:10px;padding:28px;border:1px solid #e5e7eb;">
    <div style="margin-bottom:16px;">
      <span style="display:inline-block;background:${badgeColor};color:#ffffff;font-size:11px;font-weight:700;letter-spacing:0.06em;padding:4px 10px;border-radius:999px;">${severityLabel} · ECOSTEP HEALTH ALERT</span>
    </div>
    <h1 style="margin:0 0 10px 0;font-size:20px;color:#111827;line-height:1.3;">${this.escapeHtml(payload.title)}</h1>
    <p style="margin:0 0 14px 0;font-size:14.5px;line-height:1.6;color:#374151;">${this.escapeHtml(payload.description)}</p>
    ${metricsHtml}
    ${actionHtml}
    ${linkHtml}
    <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:14px;font-size:12px;color:#6b7280;">
      Detected at ${this.escapeHtml(detectedStr)} (PHT) · EcoStep Automated Tile Health Monitor
    </div>
  </div>
</body>
</html>`.trim();

    let sent = 0;
    let failed = 0;

    for (const to of cleanRecipients) {
      try {
        const result = await this.resend.emails.send({
          from: `${this.fromName} <${this.fromEmail}>`,
          to,
          subject: `[EcoStep ${severityLabel}] ${payload.title}`,
          html,
        });
        if (result.error) {
          this.logger.warn(`Failed to send health alert email to ${to}: ${result.error.message}`);
          failed += 1;
        } else {
          sent += 1;
        }
      } catch (err: any) {
        this.logger.warn(`Health alert email error for ${to}: ${err?.message || err}`);
        failed += 1;
      }
    }

    this.logger.log(
      `Health alert email dispatched for "${payload.title}": sent=${sent}, failed=${failed}`,
    );
    return { sent, failed, skipped: false };
  }

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Check if email service is configured and ready
   *
   * @returns boolean - true if email can be sent
   */
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}
