const express = require("express");
const serverless = require("serverless-http");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();
const TrainLocation = require("./models/trainLocationModel");
const Location = require("./models/locationModel");
const connectToDatabase = require("./dbConnect");

const app = express();
app.use(bodyParser.json());

const mongoUri = process.env.MONGO_URL;

// Swagger JSON configuration
const swaggerDocument = {
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "Train Location Service API",
    "description": "API for tracking train locations and querying the latest location."
  },
  "host": "localhost:3001",
  "basePath": "/",
  "schemes": [
    "http",
    "https"
  ],
  "consumes": ["application/json"],
  "produces": ["application/json"],
  "paths": {
    "/update-location": {
      "post": {
        "summary": "Update Train Location",
        "description": "Updates the location of a train with latitude and longitude.",
        "parameters": [
          {
            "name": "body",
            "in": "body",
            "required": true,
            "description": "Train location data",
            "schema": {
              "type": "object",
              "properties": {
                "trainId": {
                  "type": "string",
                  "example": "12345",
                  "description": "Unique ID of the train"
                },
                "latitude": {
                  "type": "number",
                  "example": 6.9271,
                  "description": "Latitude of the train"
                },
                "longitude": {
                  "type": "number",
                  "example": 79.8612,
                  "description": "Longitude of the train"
                }
              },
              "required": ["trainId", "latitude", "longitude"]
            }
          }
        ],
        "responses": {
          "201": {
            "description": "Location data saved successfully"
          },
          "400": {
            "description": "Bad Request"
          },
          "500": {
            "description": "Error saving location data"
          }
        }
      }
    },
    "/train-locations/{trainId}/latest": {
      "get": {
        "summary": "Get Latest Train Location",
        "description": "Retrieves the latest location of a train based on its ID.",
        "parameters": [
          {
            "name": "trainId",
            "in": "path",
            "required": true,
            "type": "string",
            "description": "Unique ID of the train"
          }
        ],
        "responses": {
          "200": {
            "description": "Latest location of the train"
          },
          "404": {
            "description": "Train location not found"
          },
          "500": {
            "description": "Error retrieving location data"
          }
        }
      }
    }
  }
};

// Serve Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Your existing routes
app.get("/api/all-train-locations", async (req, res) => {
  console.log("Fetching all train locations...");
  try {
    await connectToDatabase();
    const allLocations = await TrainLocation.find().sort({ timestamp: -1 }).limit(100);
    console.log(`Found ${allLocations.length} locations`);
    res.status(200).json(allLocations);
  } catch (error) {
    console.error("Error fetching all train locations:", error);
    res.status(500).json({ error: "Error fetching train locations", details: error.message });
  }
});

app.get("/api/train-locations/:trainId/latest", async (req, res) => {
  console.log(`Fetching latest location for train ${req.params.trainId}`);
  try {
    await connectToDatabase();
    const { trainId } = req.params;
    const latestLocation = await TrainLocation.findOne({ trainId })
      .sort({ timestamp: -1 })
      .exec();

    if (!latestLocation) {
      console.log("Train location not found");
      return res.status(404).json({ error: "Train location not found" });
    }

    const { latitude, longitude, timestamp } = latestLocation;
    const location = await Location.findOne({ latitude, longitude });
    const name = location ? location.name : "Unknown";

    const response = { trainId, latitude, longitude, name, timestamp };
    console.log("Sending response:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching latest train location:", error);
    res
      .status(500)
      .json({
        error: "Error retrieving location data",
        details: error.message,
      });
  }
});

app.post("/api/train-locations", async (req, res) => {
  console.log("Adding new train location");
  try {
    await connectToDatabase();
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
