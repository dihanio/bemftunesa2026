import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private readonly outboxDir = path.join(process.cwd(), 'outbox');

  constructor() {
    super();
    // Create the outbox directory in workspace root if it doesn't exist
    if (!fs.existsSync(this.outboxDir)) {
      fs.mkdirSync(this.outboxDir, { recursive: true });
    }
  }

  async process(
    job: Job<
      {
        recipientEmail?: string;
        recipientPhone?: string;
        recipientName: string;
        title: string;
        message: string;
        link?: string;
      },
      unknown,
      string
    >,
  ): Promise<{ success: boolean; filePath: string } | { success: boolean }> {
    this.logger.log(
      `[BullMQ] Processing job ${job.id} of type "${job.name}"...`,
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    switch (job.name) {
      case 'sendEmail': {
        const { recipientEmail, recipientName, title, message, link } =
          job.data;

        // Premium Danadyaksa HTML Email Template
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Inter', 'Roboto', 'Outfit', sans-serif;
      background-color: #091c11;
      color: #a7f3d0;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      max-width: 600px;
      margin: 30px auto;
      background-color: #12331e;
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #10b981, #047857);
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid rgba(16, 185, 129, 0.3);
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 1px;
    }
    .header p {
      color: #a7f3d0;
      margin: 5px 0 0 0;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #ffffff;
      font-size: 18px;
      margin-top: 0;
      font-weight: 800;
    }
    .content p {
      line-height: 1.6;
      font-size: 14px;
      color: #a9b49c;
    }
    .btn-container {
      text-align: center;
      margin: 35px 0;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 28px;
      font-size: 14px;
      font-weight: 800;
      border-radius: 8px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
      transition: all 0.3s ease;
    }
    .footer {
      background-color: #091c11;
      padding: 20px;
      text-align: center;
      border-top: 1px solid rgba(16, 185, 129, 0.1);
      font-size: 11px;
      color: #708b75;
    }
    .footer a {
      color: #10b981;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>IMS DANADYAKSA</h1>
      <p>BEM FT UNESA KABINET DANADYAKSA 2026</p>
    </div>
    <div class="content">
      <h2>Halo, ${recipientName}!</h2>
      <p>Terdapat pemberitahuan operasional baru yang memerlukan perhatian Anda:</p>
      <div style="background-color: rgba(16, 185, 129, 0.05); border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong style="color: #ffffff; display: block; margin-bottom: 5px; font-size: 14px;">${title}</strong>
        <span style="font-size: 13px; color: #a7f3d0; line-height: 1.5; display: block;">${message}</span>
      </div>
      ${
        link
          ? `<div class="btn-container">
               <a class="btn" href="https://ims.bemftunesa.org${link}">Akses Instan IMS</a>
             </div>`
          : ''
      }
      <p style="font-size: 12px; font-style: italic; color: #708b75; margin-top: 30px;">
        Pesan ini dikirimkan secara otomatis oleh robot asinkron Danadyaksa ERP Notification Engine. Mohon tidak membalas email ini secara langsung.
      </p>
    </div>
    <div class="footer">
      &copy; 2026 BEM FT UNESA. All rights reserved.<br>
      Gedung A1 Sekretariat Ormawa FT, Kampus Ketintang, Surabaya.<br>
      Dikembangkan untuk <a href="#">danadyaksa-erp.unesa.ac.id</a>
    </div>
  </div>
</body>
</html>`;

        const filename = `email-${timestamp}-${recipientEmail}.html`;
        const filePath = path.join(this.outboxDir, filename);
        fs.writeFileSync(filePath, html, 'utf-8');

        this.logger.log(
          `[MOCK SMTP] Custom branded HTML Email generated successfully for "${recipientName}" <${recipientEmail}>: ${filePath}`,
        );
        return { success: true, filePath };
      }

      case 'sendWhatsApp': {
        const { recipientPhone, recipientName, title, message, link } =
          job.data;

        // Official WhatsApp Message Template
        const text = `*IMS DANADYAKSA - NOTIFIKASI OTOMATIS*
=======================================
Kepada Yth. *${recipientName}*
Fungsionaris Kabinet Danadyaksa 2026

Terdapat pembaruan status birokrasi baru di sistem ERP:

📌 *Topik:* ${title}
💬 *Detail:* ${message}
⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}

---------------------------------------
${link ? `🔗 *Link Akses:* https://ims.bemftunesa.org${link}` : ''}
---------------------------------------

_Pemberitahuan resmi dikirim secara asinkron dari robot internal BEM FT UNESA. Mohon segera melakukan koordinasi dan tindak lanjut di sistem IMS._
`;

        const filename = `whatsapp-${timestamp}-${recipientPhone}.txt`;
        const filePath = path.join(this.outboxDir, filename);
        fs.writeFileSync(filePath, text, 'utf-8');

        this.logger.log(
          `[MOCK WA GATEWAY] Dynamic WhatsApp text draft generated successfully for "${recipientName}" [${recipientPhone}]: ${filePath}`,
        );
        return { success: true, filePath };
      }

      default:
        this.logger.warn(`[BullMQ] Received unknown job type: "${job.name}"`);
        return { success: false };
    }
  }
}
