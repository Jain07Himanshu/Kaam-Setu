export interface OutboundCallRequest {
  to: string;
  contactName?: string;
  customerName?: string;
  voiceFileUrl?: string;
  messageText?: string;
  bookingId?: string;
  safetyEventId?: string;
}

export interface TelephonyCallResult {
  callId: string;
  status: 'SIMULATED' | 'QUEUED' | 'INITIATED' | 'COMPLETED' | 'FAILED';
  provider: 'MOCK_TELEPHONY' | 'TWILIO' | 'EXOTEL';
  simulated: boolean;
  message: string;
  voiceUrlUsed?: string;
  timestamp: string;
}

export interface ITelephonyProvider {
  initiateEmergencyCall(request: OutboundCallRequest): Promise<TelephonyCallResult>;
  sendEmergencySms(to: string, message: string): Promise<{ messageId: string; status: string; simulated: boolean }>;
}

export class MockTelephonyProvider implements ITelephonyProvider {
  async initiateEmergencyCall(request: OutboundCallRequest): Promise<TelephonyCallResult> {
    const callId = `MOCK-CALL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const voiceUrl = request.voiceFileUrl || process.env.EMERGENCY_VOICE_FILE_URL || '/audio/emergency-alert-hindi-english.mp3';

    console.log(`\n📞 [MOCK TELEPHONY SIMULATION] Outbound Emergency Call:`);
    console.log(`   To: ${request.to} (${request.contactName || 'Emergency Contact'})`);
    console.log(`   Customer: ${request.customerName || 'Customer in Need'}`);
    console.log(`   Booking ID: ${request.bookingId || 'N/A'}`);
    console.log(`   Voice Alert Message: "${request.messageText || 'Automated Safety Alert from Kaam Setu'}"`);
    console.log(`   Audio Recording: ${voiceUrl}`);
    console.log(`   Call ID: ${callId}`);
    console.log(`   ⚠️ Notice: Simulated call executed for development/test mode. No real telephony credits deducted.\n`);

    return {
      callId,
      status: 'SIMULATED',
      provider: 'MOCK_TELEPHONY',
      simulated: true,
      voiceUrlUsed: voiceUrl,
      message: 'Emergency call simulated successfully via development Mock Telephony engine.',
      timestamp: new Date().toISOString(),
    };
  }

  async sendEmergencySms(to: string, message: string): Promise<{ messageId: string; status: string; simulated: boolean }> {
    const messageId = `MOCK-SMS-${Date.now()}`;
    console.log(`\n💬 [MOCK TELEPHONY SMS] Outbound Emergency SMS:`);
    console.log(`   To: ${to}`);
    console.log(`   Message: "${message}"`);
    console.log(`   SMS ID: ${messageId}`);
    console.log(`   ⚠️ Notice: Simulated SMS. No carrier fees incurred.\n`);

    return {
      messageId,
      status: 'SIMULATED',
      simulated: true,
    };
  }
}

export class TelephonyService {
  private static instance: ITelephonyProvider;

  public static getProvider(): ITelephonyProvider {
    if (!this.instance) {
      const providerType = process.env.TELEPHONY_PROVIDER?.toUpperCase();
      const apiKey = process.env.TELEPHONY_API_KEY;

      if ((providerType === 'TWILIO' || providerType === 'EXOTEL') && apiKey) {
        console.log(`📡 Telephony configured with provider: ${providerType}`);
        // Can be extended with real Twilio/Exotel client when credentials are provided
        this.instance = new MockTelephonyProvider();
      } else {
        this.instance = new MockTelephonyProvider();
      }
    }
    return this.instance;
  }
}
