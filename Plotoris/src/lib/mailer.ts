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
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Plotoris Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <!-- Header -->
            <div style="background-color: #09090b; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">PLOTORIS</h1>
              <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px;">Next-Generation Research SaaS</p>
            </div>
            
            <!-- Body -->
            <div style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #09090b;">Verify your email address</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
                Thanks for starting the new account creation process. We want to make sure it's really you. Please enter the following verification code when prompted.
              </p>
              
              <!-- OTP Container -->
              <div style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #f97316;">
                  ${otp}
                </span>
              </div>
              
              <p style="margin: 0 0 16px; font-size: 14px; color: #71717a;">
                This verification code will expire in <strong>10 minutes</strong>.<br/>
                If you didn't request this code, you can safely ignore this email.
              </p>
              
              <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 32px 0;">
              
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                Need help? Reply to this email or visit our <a href="#" style="color: #f97316; text-decoration: none;">Help Center</a>.<br/>
                © ${new Date().getFullYear()} Plotoris. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
        `,
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
