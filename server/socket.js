const Room = require("./models/Room");

module.exports = function (io) {

  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("set-username", (username) => {
      socket.username = username || "User";
    });

    /* ---------------- GET ROOMS (5 MIN ACTIVE) ---------------- */
    socket.on("get-rooms", async () => {
      const cutoff = new Date(Date.now() - 5 * 60 * 1000);
      const rooms = await Room.find({ updatedAt: { $gte: cutoff } });
      socket.emit("rooms-update", rooms);
    });

    /* ---------------- CREATE ROOM ---------------- */
    socket.on("create-room", async ({ name, type }) => {
      const room = await Room.create({
        name,
        type,
        hostId: socket.id,
        members: [{ socketId: socket.id, username: socket.username }],
        media: null
      });

      socket.join(room._id.toString());

      io.emit("rooms-update", await Room.find());

      socket.emit("room-info", {
        name: room.name,
        hostId: room.hostId
      });

      socket.emit("you-are-host", true);
      emitUsers(room._id);
    });

    /* ---------------- JOIN ROOM ---------------- */
    socket.on("join-room-final", async (roomId) => {
      if (!roomId) return;

      const room = await Room.findById(roomId);
      if (!room) {
        console.log("Join attempt for non-existing room:", roomId);
        socket.emit("join-error", "Room not found");
        return;
      }

      socket.join(roomId);

      if (!room.members.find(m => m.socketId === socket.id)) {
        room.members.push({
          socketId: socket.id,
          username: socket.username
        });
        await room.save();
      }

      socket.emit("room-info", {
        name: room.name,
        hostId: room.hostId
      });

      socket.emit("you-are-host", room.hostId === socket.id);

      emitUsers(roomId);

      if (room.media) {
        socket.emit("load-media", room.media);
      }

      console.log("Joined room:", roomId);
    });

    /* ---------------- MEDIA (HOST ONLY) ---------------- */
    socket.on("load-media", async ({ roomId, media }) => {
      const room = await Room.findById(roomId);
      if (!room) return;
      if (socket.id !== room.hostId) return;

      room.media = media;
      await room.save();

      io.to(roomId).emit("load-media", media);
    });

    /* ---------------- CHAT ---------------- */
    socket.on("chat", (msg) => {
      io.emit("chat", {
        user: socket.username,
        msg
      });
    });

    /* ---------------- DISCONNECT ---------------- */
    socket.on("disconnect", async () => {
      const rooms = await Room.find({ "members.socketId": socket.id });

      for (const room of rooms) {
        room.members = room.members.filter(m => m.socketId !== socket.id);

        if (room.hostId === socket.id) {
          room.hostId = room.members[0]?.socketId || null;
        }

        await room.save();
        emitUsers(room._id);
      }
    });

    /* ---------------- USERS LIST ---------------- */
    async function emitUsers(roomId) {
      const room = await Room.findById(roomId);
      if (!room) return;

      const users = room.members.map(m => ({
        username: m.username,
        isHost: m.socketId === room.hostId
      }));

      io.to(roomId.toString()).emit("room-users", users);
      
    }
  });
};
