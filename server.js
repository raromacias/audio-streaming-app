// 

const { Server } = require("socket.io");

const io = new Server(3000, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  socket.on("signal", (data) => {
    const { to, from, signal } = data;
    io.to(to).emit("signal", { signal, from });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
