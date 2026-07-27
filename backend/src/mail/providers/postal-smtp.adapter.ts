import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  EmailProvider,
  SendVerificationEmailPayload,
} from './email-provider.interface';

@Injectable()
export class PostalSmtpAdapter implements EmailProvider {
  readonly name = 'postal-smtp';
  private readonly logger = new Logger(PostalSmtpAdapter.name);
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'postal'),
      port: Number(this.configService.get('SMTP_PORT')) || 25,
      secure: Number(this.configService.get('SMTP_PORT')) === 465,
      auth: this.configService.get<string>('SMTP_USER')
        ? {
            user: this.configService.get<string>('SMTP_USER'),
            pass: this.configService.get<string>('SMTP_PASS'),
          }
        : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendVerificationEmail(
    payload: SendVerificationEmailPayload,
  ): Promise<void> {
    const fromName = this.configService.get<string>(
      'SMTP_FROM_NAME',
      'BEM FT UNESA 2026',
    );
    const fromEmail = this.configService.get<string>(
      'SMTP_FROM_EMAIL',
      'noreply@bemftunesa.org',
    );

    const html = this.buildVerificationHtml(
      payload.name,
      payload.otp,
      payload.expiresInMinutes,
    );
    const text = this.buildVerificationText(
      payload.name,
      payload.otp,
      payload.expiresInMinutes,
    );

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: payload.to,
      subject: `[BEM FT UNESA] Kode Verifikasi Email Anda — ${payload.otp}`,
      text,
      html,
    });

    this.logger.log(
      `Verification email sent to ${payload.to} via ${this.name}`,
    );
  }

  async sendMail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    const fromName = this.configService.get<string>(
      'SMTP_FROM_NAME',
      'BEM FT UNESA 2026',
    );
    const fromEmail = this.configService.get<string>(
      'SMTP_FROM_EMAIL',
      'noreply@bemftunesa.org',
    );

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html: this.buildGenericHtml(template, context),
    });
  }

  private buildVerificationHtml(
    name: string,
    otp: string,
    expiresInMinutes: number,
  ): string {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verifikasi Email — BEM FT UNESA 2026</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #1a1a1a;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ff6b00,#ff8c33);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">BEM FT UNESA 2026</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:400;">Kabinet Danadyaksa &bull; Portal PKKMB</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;color:#ff8c33;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Verifikasi Email</p>
              <h2 style="margin:0 0 16px;color:#ffffff;font-size:22px;font-weight:700;">Halo, ${this.escapeHtml(name)}!</h2>
              <p style="margin:0 0 24px;color:#999999;font-size:15px;line-height:1.6;">
                Terima kasih telah mendaftar di Portal PKKMB FT UNESA 2026. Masukkan kode verifikasi di bawah ini untuk mengaktifkan akun Anda.
              </p>

              <!-- OTP Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#1a1a1a;border:2px solid #ff6b00;border-radius:12px;padding:24px;text-align:center;">
                    <p style="margin:0 0 8px;color:#666666;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Kode Verifikasi Anda</p>
                    <p style="margin:0;color:#ff6b00;font-size:36px;font-weight:800;letter-spacing:8px;font-family:'Courier New',Courier,monospace;">${this.escapeHtml(otp)}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#666666;font-size:13px;text-align:center;">
                Kode ini berlaku selama <strong style="color:#ff8c33;">${expiresInMinutes} menit</strong>. Jangan bagikan kode ini kepada siapa pun.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #1a1a1a;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;">
              <p style="margin:0 0 8px;color:#555555;font-size:12px;line-height:1.5;">
                Email ini dikirim secara otomatis oleh sistem Portal PKKMB FT UNESA 2026. Jika Anda tidak merasa mendaftar, abaikan email ini.
              </p>
              <p style="margin:0;color:#444444;font-size:11px;">
                &copy; 2026 BEM Fakultas Teknik Universitas Negeri Surabaya. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private buildVerificationText(
    name: string,
    otp: string,
    expiresInMinutes: number,
  ): string {
    return `BEM FT UNESA 2026 — Kabinet Danadyaksa
===============================================

Halo, ${name}!

Kode verifikasi Anda adalah: ${otp}

Kode ini berlaku selama ${expiresInMinutes} menit.
Jangan bagikan kode ini kepada siapa pun.

Jika Anda tidak merasa mendaftar, abaikan email ini.

© 2026 BEM Fakultas Teknik Universitas Negeri Surabaya`;
  }

  private buildGenericHtml(
    template: string,
    context: Record<string, unknown>,
  ): string {
    let html = template;
    for (const [key, value] of Object.entries(context)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return html;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
