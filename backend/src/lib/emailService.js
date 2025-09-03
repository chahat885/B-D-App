import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

console.log('Email credentials check:', {
  user: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
  pass: process.env.EMAIL_PASS ? 'SET' : 'NOT SET'
});

// Create transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,       // SSL port
    secure: true,    // must be true for port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('Transporter verification failed:', error);
  } else {
    console.log('Transporter is ready to send emails');
  }
});

export const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'NITK Badminton Court Booking - Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">NITK Badminton Court Booking</h2>
        <p>Hello ${name},</p>
        <p>Your email verification OTP is:</p>
        <div style="background-color: #ecf0f1; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #e74c3c; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px;">NITK Badminton Court Booking System</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

export default { sendOTPEmail };
