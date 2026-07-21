import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from './mail.service';

@Injectable()
export class MailListener {
  private readonly logger = new Logger(MailListener.name);

  constructor(private readonly mailService: MailService) {}

  @OnEvent('applicant.created')
  handleApplicantCreated(payload: { email: string; name: string }) {
    this.logger.log(`Handling applicant.created event for ${payload.email}`);
    this.mailService.sendMail(
      payload.email,
      'Welcome to BEM FT UNESA Recruitment',
      'welcome', // welcome.hbs
      {
        name: payload.name,
      }
    );
  }

  @OnEvent('applicant.status.updated')
  handleApplicantStatusUpdated(payload: { email: string; name: string; status: string }) {
    this.logger.log(`Handling applicant.status.updated event for ${payload.email}`);
    this.mailService.sendMail(
      payload.email,
      'Update on Your Application Status',
      'status-update', // status-update.hbs
      {
        name: payload.name,
        status: payload.status,
      }
    );
  }

  @OnEvent('aspiration.responded')
  handleAspirationResponded(payload: { email: string; name: string; subject: string; response: string }) {
    this.logger.log(`Handling aspiration.responded event for ${payload.email}`);
    this.mailService.sendMail(
      payload.email,
      'Response to Your Aspiration',
      'aspiration-response', // aspiration-response.hbs
      {
        name: payload.name,
        subject: payload.subject,
        response: payload.response,
      }
    );
  }
}
