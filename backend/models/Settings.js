const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  minLimit: {
    type: Number,
    required: true,
    default: 2000
  },
  maxLimit: {
    type: Number,
    required: true,
    default: 4000
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Only one settings document will exist
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ minLimit: 2000, maxLimit: 4000 });
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);