const mongoose = require('mongoose');

const waterEntrySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    default: 250
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WaterEntry', waterEntrySchema);