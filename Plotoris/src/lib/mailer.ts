import { Resend } from 'resend';

// Use Resend for real emails, or log to console if key is missing (for local dev fallback)
export const sendOtpEmail = async (email: string, otp: string) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    const resend = new Resend(resendApiKey);

    try {
      const { data, error } = await resend.emails.send({
        from: 'Plotoris Auth <noreply@plotoris.com>', // Update with your verified domain in Resend
        to: email,
        subject: 'Your Plotoris Verification Code',
        text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
        html: `<b>Your verification code is: <span style="font-size:24px;">${otp}</span></b><br/><p>It will expire in 10 minutes.</p>`,
      });

      if (error) {
        console.error('Resend Error:', error);
      } else {
        console.log('Message sent via Resend: %s', data?.id);
      }
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
    }
  } else {
    // Local development fallback
    console.log('----------------------------------------------------');
    console.log('No RESEND_API_KEY found in environment variables.');
    console.log(`Fallback: Email intended for ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log('----------------------------------------------------');
  }
};
