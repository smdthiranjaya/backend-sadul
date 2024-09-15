const WebSocket = require("ws");
const axios = require("axios");

const server = new WebSocket.Server({ port: 8080 });
const trainIds = [
  "train1",
  "train2",
  "train3",
  "train4",
  "train5",
  "train6",
  "train7",
  "train8",
  "train9",
  "train10",
];

server.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", async (message) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (error) {
      socket.send("Invalid message format");
      return;
    }

    const { type, trainId } = parsedMessage;

    if (type === "fetch-data" && trainId) {
      try {
        const response = await axios.get(
          `http://localhost:3001/train-locations/${trainId}/latest`
        );

        console.log(response);
        socket.send(JSON.stringify(response.data));
      } catch (error) {
        socket.send("Error fetching data from API");
      }
    } else {
      socket.send("Invalid message type or missing ID");
    }
  });

  setInterval(async () => {
    for (const trainId of trainIds) {
      try {
        const response = await axios.get(
          `http://localhost:3001/train-locations/${trainId}/latest`
        );
        server.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(response.data));
          }
        });
      } catch (error) {
        console.error(`Error fetching data for ${trainId}:`, error);
      }
    }
  }, 60000);

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("WebSocket Service is running on ws://localhost:8080");
