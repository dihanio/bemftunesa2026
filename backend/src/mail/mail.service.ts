import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailLog, MailLogDocument } from '../schemas/mail-log.schema';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    @InjectModel(MailLog.name) private readonly mailLogModel: Model<MailLogDocument>,
  ) {}

  async sendMail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template: `./${template}`, // The `.hbs` extension is appended automatically
        context,
      });

      this.logger.log(`Email successfully sent to ${to} (Subject: ${subject})`);
      
      await this.logMail(to, subject, template, 'nodemailer', 'success', null);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to} (Subject: ${subject})`,
        error instanceof Error ? error.stack : 'Unknown Error'
      );
      
      await this.logMail(to, subject, template, 'nodemailer', 'failed', error instanceof Error ? error.message : 'Unknown Error');
    }
  }

  private async logMail(
    recipient: string,
    subject: string,
    template: string,
    provider: string,
    status: 'success' | 'failed',
    errorMessage: string | null,
  ) {
    try {
      await this.mailLogModel.create({
        recipient,
        subject,
        template,
        provider,
        status,
        errorMessage,
      });
    } catch (logError) {
      this.logger.error('Failed to log email attempt', logError instanceof Error ? logError.stack : 'Unknown Error');
    }
  }
}
