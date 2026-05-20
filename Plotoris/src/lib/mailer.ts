import nodemailer from 'nodemailer';

// Use Ethereal for testing or real SMTP if configured
export const sendOtpEmail = async (email: string, otp: string) => {
  let transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test account automatically for local development
    console.log('No SMTP credentials found, using Ethereal email for testing.');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const info = await transporter.sendMail({
    from: '"Plotoris Auth" <noreply@plotoris.com>',
    to: email,
    subject: 'Your Plotoris Verification Code',
    text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
    html: `<b>Your verification code is: <span style="font-size:24px;">${otp}</span></b><br/><p>It will expire in 10 minutes.</p>`,
  });

  console.log('Message sent: %s', info.messageId);
  if (!process.env.SMTP_HOST) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
};
