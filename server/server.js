const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ✅ MongoDB connection
mongoose.connect(
  "mongodb+srv://priyansh:2007@cluster0.ne6ccgo.mongodb.net/watchparty"
).then(() => {
  console.log("✅ MongoDB connected");
}).catch(err => {
  console.error("❌ MongoDB error", err.message);
});

require("./socket")(io);

server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
