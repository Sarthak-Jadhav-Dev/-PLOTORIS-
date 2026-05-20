// Global in-memory store for OTPs
// In a real production app, use Redis or a database table

interface OtpData {
  otp: string;
  name: string;
  passwordHash: string;
  expiresAt: number;
}

declare global {
  var otpStore: Map<string, OtpData> | undefined;
}

export const otpStore = global.otpStore || new Map<string, OtpData>();

if (process.env.NODE_ENV !== 'production') {
  global.otpStore = otpStore;
}
