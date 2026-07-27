export interface SendVerificationEmailPayload {
  to: string;
  name: string;
  otp: string;
  expiresInMinutes: number;
}

export interface EmailProvider {
  readonly name: string;
  sendVerificationEmail(payload: SendVerificationEmailPayload): Promise<void>;
  sendMail(to: string, subject: string, template: string, context: Record<string, unknown>): Promise<void>;
}
