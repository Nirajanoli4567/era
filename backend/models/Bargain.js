const mongoose = require('mongoose');

const bargainSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  offeredPrice: {
    type: Number,
    required: true
  },
  counterOffer: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'countered'],
    default: 'pending'
  },
  messages: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps before saving
bargainSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Bargain = mongoose.model('Bargain', bargainSchema);

module.exports = Bargain; 