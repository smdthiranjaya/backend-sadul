const mongoose = require("mongoose");

const mongoUri = "mongodb+srv://sudeerachandrajith1212:aQS1IfKfBLRhnGWy@cluster0.7dckg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    cachedConnection = connection;
    console.log("Connected to MongoDB successfully");
    return connection;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

module.exports = connectToDatabase;