const express = require("express");
const serverless = require("serverless-http");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs"); // To load YAML file
require("dotenv").config();
const TrainLocation = require("./models/trainLocationModel");
const Location = require("./models/locationModel");

const app = express();
app.use(bodyParser.json());

const mongoUri = process.env.MONGO_URL;

mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

const connectWithRetry = () => {
  mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB successfully"))
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
      console.log("Retrying connection in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// // Load swagger.yaml
// const swaggerDocument = YAML.load('swagger.yaml'); // Assuming swagger.yaml is in the project root
// console.log("swaggerDocument: ", swaggerDocument); // Add this line after loading the YAML file

// // Serve Swagger UI
// app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// // Serve Swagger YAML as JSON
// app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
//   swaggerOptions: {
//     url: "/api/swagger.yaml",  // Or provide the correct relative path to your swagger.yaml file
//   },
// }));

// Your existing routes
app.get("/api/all-train-locations", async (req, res) => {
  console.log("Fetching all train locations...");
  try {
    const allLocations = await TrainLocation.find()
      .sort({ timestamp: -1 })
      .limit(100);
    console.log(`Found ${allLocations.length} locations`);
    res.status(200).json(allLocations);
  } catch (error) {
    console.error("Error fetching all train locations:", error);
    res
      .status(500)
      .json({
        error: "Error fetching train locations",
        details: error.message,
      });
  }
});

app.get("/api/train-locations/:trainId/latest", async (req, res) => {
  console.log(`Fetching latest location for train ${req.params.trainId}`);
  try {
    const { trainId } = req.params;
    const latestLocation = await TrainLocation.findOne({ trainId })
      .sort({ timestamp: -1 })
      .maxTimeMS(5000)
      .exec();

    if (!latestLocation) {
      console.log("Train location not found");
      return res.status(404).json({ error: "Train location not found" });
    }

    const { latitude, longitude, timestamp } = latestLocation;
    const location = await Location.findOne({ latitude, longitude }).maxTimeMS(
      5000
    );
    const name = location ? location.name : "Unknown";

    const response = { trainId, latitude, longitude, name, timestamp };
    console.log("Sending response:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching latest train location:", error);
    if (error.name === "MongoTimeoutError") {
      res
        .status(504)
        .json({
          error: "Database operation timed out",
          details: "Please try again later",
        });
    } else {
      res
        .status(500)
        .json({
          error: "Error retrieving location data",
          details: error.message,
        });
    }
  }
});

app.post("/api/train-locations", async (req, res) => {
  console.log("Adding new train location");
  try {
    const newLocation = new TrainLocation(req.body);
    const savedLocation = await newLocation.save();
    console.log("New location added:", savedLocation);
    res.status(201).json(savedLocation);
  } catch (error) {
    console.error("Error adding new train location:", error);
    res
      .status(500)
      .json({ error: "Error adding train location", details: error.message });
  }
});

const handler = serverless(app);

exports.handler = async (event, context) => {
  console.log("Handler called", event.path);
  context.callbackWaitsForEmptyEventLoop = false;
  return handler(event, context);
};
