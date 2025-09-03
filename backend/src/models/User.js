import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true,
      validate: {
        validator: function(email) {
          return email.endsWith('@nitk.edu.in');
        },
        message: 'Only NITK college emails are allowed'
      }
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student', index: true },
    isEmailVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null }
  },
  { timestamps: true }
);

UserSchema.methods.setPassword = async function setPassword(plainPassword) {
  const saltRounds = 10;
  this.passwordHash = await bcrypt.hash(plainPassword, saltRounds);
};

UserSchema.methods.validatePassword = async function validatePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

UserSchema.methods.generateOTP = function generateOTP() {
  this.otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return this.otp;
};

UserSchema.methods.verifyOTP = function verifyOTP(inputOTP) {
  if (!this.otp || !this.otpExpiry) return false;
  if (Date.now() > this.otpExpiry.getTime()) return false;
  return this.otp === inputOTP;
};

export default mongoose.model('User', UserSchema);


