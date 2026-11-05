export interface SmsSendResult {
  messageId: string;
  success: boolean;
  simulated: boolean;
  status: string;
}

export interface ISmsProvider {
  sendOtp(phone: string, otp: string): Promise<SmsSendResult>;
}

export class MockSmsProvider implements ISmsProvider {
  async sendOtp(phone: string, otp: string): Promise<SmsSendResult> {
    const messageId = `MOCK-SMS-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    console.log(`\n📱 [MOCK SMS PROVIDER] Simulated OTP Transmission:`);
    console.log(`   Destination Phone: ${phone}`);
    console.log(`   Verification OTP: [ ${otp} ] (Valid for 5 minutes)`);
    console.log(`   Provider Message ID: ${messageId}`);
    console.log(`   ⚠️ Notice: Development mock OTP. In production, configure SMS_PROVIDER, SMS_API_KEY.\n`);

    return {
      messageId,
      success: true,
      simulated: true,
      status: 'DELIVERED_MOCK',
    };
  }
}

export class SmsService {
  private static instance: ISmsProvider;

  public static getProvider(): ISmsProvider {
    if (!this.instance) {
      const apiKey = process.env.SMS_API_KEY;
      if (apiKey) {
        // Can plug real Fast2SMS / Twilio / Gupshup provider here
        this.instance = new MockSmsProvider();
      } else {
        this.instance = new MockSmsProvider();
      }
    }
    return this.instance;
  }
}
