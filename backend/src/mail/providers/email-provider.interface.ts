export interface EmailProvider {
  readonly name: string;
  sendMail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, unknown>,
  ): Promise<void>;
}
