const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: String,
  socketId: String,
  roomId: String
});

module.exports = mongoose.model("User", UserSchema);
