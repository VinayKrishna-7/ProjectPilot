import nodemailer, { Transporter } from 'nodemailer';
import { env } from './env';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class MailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: env.SMTP_FROM,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>/g, ''),
        });
        return true;
      }

      // Development / Standby fallback: Log to console
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 [EMAIL SERVICE - DEV DISPATCH]`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Content:\n${options.text || options.html.replace(/<[^>]*>/g, '')}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return true;
    } catch (error) {
      console.error('Failed to dispatch email:', error);
      return false;
    }
  }

  async sendWorkspaceInvite(params: {
    to: string;
    workspaceName: string;
    inviterName: string;
    role: string;
    inviteUrl: string;
  }): Promise<boolean> {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #2563eb;">You're invited to join ${params.workspaceName}</h2>
        <p><strong>${params.inviterName}</strong> has invited you to collaborate on <strong>${params.workspaceName}</strong> as a <strong>${params.role}</strong>.</p>
        <div style="margin: 30px 0;">
          <a href="${params.inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">Or copy and paste this link into your browser: <br/><a href="${params.inviteUrl}">${params.inviteUrl}</a></p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">This invitation link will expire in 7 days.</p>
      </div>
    `;

    return this.sendMail({
      to: params.to,
      subject: `Invitation to join ${params.workspaceName} on ProjectPilot`,
      html,
    });
  }
}

export const mailService = new MailService();
