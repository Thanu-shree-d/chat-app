const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect("mongodb://127.0.0.1:27017/chatapp")
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

const Message = mongoose.model("Message", {
  text: String,
  sender: String,
  time: String,
  image: String,
  seen: Boolean
});

const io = new Server(server, {
  cors: { origin: "*" }
});

let users = {};

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("join", (username) => {
    users[username] = socket.id;
    io.emit("onlineUsers", Object.keys(users));
  });

  socket.on("sendMessage", async (data) => {
    const msg = await Message.create({
      ...data,
      seen: false
    });

    io.emit("receiveMessage", msg);
  });

  socket.on("disconnect", () => {
    for (let user in users) {
      if (users[user] === socket.id) {
        delete users[user];
      }
    }
    io.emit("onlineUsers", Object.keys(users));
  });
});

app.get("/messages", async (req, res) => {
  const msgs = await Message.find();
  res.json(msgs);
});

server.listen(5000, () => {
  console.log("Server running on 5000");
});