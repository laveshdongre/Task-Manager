const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['admin', 'member', 'manager'],
    default: 'member',
  },
  status: {
    type: String,
    enum: ['active', 'busy', 'in-meeting', 'away', 'offline'],
    default: 'active',
  },
  availability: {
    type: String,
    enum: ['available', 'away', 'busy', 'offline'],
    default: 'available',
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  assignedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  }],
  activity: [
    {
      type: {
        type: String,
        enum: ['login', 'task', 'project', 'status', 'role', 'other'],
        default: 'other',
      },
      detail: String,
      createdAt: { type: Date, default: Date.now },
    }
  ],
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
