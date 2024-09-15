const mongoose = require('mongoose');

const trainLocationSchema = new mongoose.Schema({
  trainId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.models.TrainLocation || mongoose.model('TrainLocation', trainLocationSchema);