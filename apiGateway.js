const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// Proxy requests to the Train Location Service
app.use(
  "/train-locations",
  createProxyMiddleware({ target: "http://localhost:3001", changeOrigin: true })
);

// Proxy WebSocket requests to the WebSocket Service
app.use(
  "/ws",
  createProxyMiddleware({
    target: "http://localhost:8080",
    ws: true,
    changeOrigin: true,
  })
);

app.listen(3000, () => {
  console.log("API Gateway is running on http://localhost:3000");
});
