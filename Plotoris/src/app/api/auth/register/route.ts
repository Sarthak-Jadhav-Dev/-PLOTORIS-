import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mailer';
import { otpStore } from '@/lib/otpStore';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Hash the password for security before storing it in OTP cache temporarily
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in memory (expires in 10 minutes)
    otpStore.set(email, {
      otp,
      name,
      passwordHash,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Send OTP via email using nodemailer
    await sendOtpEmail(email, otp);

    return NextResponse.json({ message: 'OTP sent successfully to email' }, { status: 200 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
