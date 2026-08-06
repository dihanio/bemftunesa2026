import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { EmailProvider } from './email-provider.interface';

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
}
