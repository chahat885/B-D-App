import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOTPEmail } from '../lib/emailService.js';

const router = express.Router();

// Send OTP for email verification
router.post(
  '/send-otp',
  [body('email').isEmail().custom(email => {
    if (!email.endsWith('@nitk.edu.in')) {
      throw new Error('Only NITK college emails are allowed');
    }
    return true;
  })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { email } = req.body;
    
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'User not found. Please register first.' });
      }
      
      const otp = user.generateOTP();
      await user.save();
      
      const emailSent = await sendOTPEmail(email, otp, user.name);
      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send OTP email' });
      }
      
      return res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Send OTP error:', error);
      return res.status(500).json({ error: 'Failed to send OTP' });
    }
  }
);

// Verify OTP and complete registration
router.post(
  '/verify-otp',
  [body('email').isEmail(), body('otp').isLength({ min: 6, max: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { email, otp } = req.body;
    
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.isEmailVerified) {
        return res.status(400).json({ error: 'Email already verified' });
      }
      
      if (!user.verifyOTP(otp)) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
      
      user.isEmailVerified = true;
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      
      return res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Verify OTP error:', error);
      return res.status(500).json({ error: 'Failed to verify OTP' });
    }
  }
);

router.post(
  '/register',
  [
    body('name').isString().notEmpty(),
    body('email').isEmail().custom(email => {
      if (!email.endsWith('@nitk.edu.in')) {
        throw new Error('Only NITK college emails are allowed');
      }
      return true;
    }),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['student', 'admin'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { name, email, password, role } = req.body;
    
    try {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already in use' });
      
      const user = new User({ name, email, role: role || 'student' });
      await user.setPassword(password);
      
      // Generate and send OTP
      const otp = user.generateOTP();
      await user.save();
      
      const emailSent = await sendOTPEmail(email, otp, name);
      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send OTP email' });
      }
      
      return res.status(201).json({ 
        message: 'Registration successful. Please check your email for OTP verification.',
        id: user._id 
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').isString()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { email, password } = req.body;
    
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      
      const ok = await user.validatePassword(password);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      
      if (!user.isEmailVerified) {
        return res.status(403).json({ error: 'Please verify your email with OTP before logging in' });
      }
      
      const token = jwt.sign(
        { id: user._id, role: user.role, name: user.name }, 
        process.env.JWT_SECRET || 'dev_secret', 
        { expiresIn: '7d' }
      );
      
      return res.json({ 
        token, 
        user: { 
          id: user._id, 
          role: user.role, 
          name: user.name, 
          email: user.email 
        } 
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Logout (invalidate token on frontend)
router.post('/logout', (req, res) => {
  // Note: JWT tokens are stateless, so we can't invalidate them server-side
  // Frontend should remove the token from localStorage
  return res.json({ message: 'Logged out successfully' });
});

export default router;


