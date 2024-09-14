const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const TrainLocation = require("../models/trainLocationModel");
const Location = require("../models/locationModel");

const app = express();
app.use(bodyParser.json());

const mongoUri = process.env.MONGO_URL;

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

app.post("/update-location", async (req, res) => {
  try {
    const { trainId, latitude, longitude } = req.body;

    if (!trainId || !latitude || !longitude) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newLocation = new TrainLocation({
      trainId,
      latitude,
      longitude,
      timestamp: Date.now(),
    });

    await newLocation.save();
    res.status(201).json({ message: "Location data saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error saving location data" });
  }
});

app.get("/train-locations/:trainId/latest", async (req, res) => {
  try {
    const { trainId } = req.params;
    const latestLocation = await TrainLocation.findOne({ trainId })
      .sort({ timestamp: -1 })
      .exec();

    if (!latestLocation) {
      return res.status(404).json({ error: "Train location not found" });
    }
    const { latitude, longitude, timestamp } = latestLocation;
    const location = await Location.findOne({ latitude, longitude });

    const { name } = location;

    res.status(200).json({ trainId, latitude, longitude, name, timestamp });

    // res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving location data" });
  }
});

app.listen(3001, () => {
  console.log("Train Location Service is running on http://localhost:3001");
});
