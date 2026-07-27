import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PostalSmtpAdapter } from './providers/postal-smtp.adapter';

@Injectable()
export class MailListener {
  private readonly logger = new Logger(MailListener.name);

  constructor(private readonly postalAdapter: PostalSmtpAdapter) {}

  @OnEvent('email.verification.send', { async: true })
  async handleVerificationEmail(payload: {
    to: string;
    name: string;
    otp: string;
    userId: string;
  }) {
    this.logger.log(
      `Handling email.verification.send for ${payload.to} (userId: ${payload.userId})`,
    );

    try {
      await this.postalAdapter.sendVerificationEmail({
        to: payload.to,
        name: payload.name,
        otp: payload.otp,
        expiresInMinutes: 10,
      });
      this.logger.log(`Verification email dispatched to ${payload.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${payload.to}`,
        error instanceof Error ? error.stack : 'Unknown error',
      );
    }
  }

  @OnEvent('applicant.created')
  async handleApplicantCreated(payload: { email: string; name: string }) {
    this.logger.log(`Handling applicant.created event for ${payload.email}`);
    await this.postalAdapter.sendMail(
      payload.email,
      'Welcome to BEM FT UNESA Recruitment',
      'welcome',
      {
        name: payload.name,
      },
    );
  }

  @OnEvent('applicant.status.updated')
  async handleApplicantStatusUpdated(payload: {
    email: string;
    name: string;
    status: string;
  }) {
    this.logger.log(
      `Handling applicant.status.updated event for ${payload.email}`,
    );
    await this.postalAdapter.sendMail(
      payload.email,
      'Update on Your Application Status',
      'status-update',
      {
        name: payload.name,
        status: payload.status,
      },
    );
  }

  @OnEvent('aspiration.responded')
  async handleAspirationResponded(payload: {
    email: string;
    name: string;
    subject: string;
    response: string;
  }) {
    this.logger.log(`Handling aspiration.responded event for ${payload.email}`);
    await this.postalAdapter.sendMail(
      payload.email,
      'Response to Your Aspiration',
      'aspiration-response',
      {
        name: payload.name,
        subject: payload.subject,
        response: payload.response,
      },
    );
  }
}
