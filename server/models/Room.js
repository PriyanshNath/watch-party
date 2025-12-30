const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema({
  socketId: String,
  username: String
}, { _id: false });

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "public" },

  // 🔥 DO NOT make this required
  hostId: { type: String, default: null },

  members: { type: [MemberSchema], default: [] },
  media: { type: Object, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Room", RoomSchema);
