const mongoose = require("mongoose");

const trainLocationSchema = new mongoose.Schema({
  trainId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, expires: "90d" },
});

module.exports = mongoose.model("TrainLocation", trainLocationSchema);
