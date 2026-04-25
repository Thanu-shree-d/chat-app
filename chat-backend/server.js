const express = require("express");
const app = express();

app.use(express.json());

// ✅ ADD THIS ROUTE
app.get("/messages", (req, res) => {
  res.json([
    { text: "Hello" },
    { text: "Hi Thanushree" }
  ]);
});
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* ================== MongoDB ================== */
mongoose.connect("mongodb://127.0.0.1:27017/chatapp")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

/* ================== File Upload ================== */
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

/* ================== Socket.io ================== */
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

let onlineUsers = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User Online
    socket.on("userOnline", (userId) => {
        onlineUsers[userId] = socket.id;
        io.emit("onlineUsers", onlineUsers);
    });

    // Typing
    socket.on("typing", ({ sender, receiver }) => {
        if (onlineUsers[receiver]) {
            io.to(onlineUsers[receiver]).emit("typing", sender);
        }
    });

    // Send Message
    socket.on("sendMessage", async (data) => {
        const newMessage = new Message({
            sender: data.sender,
            receiver: data.receiver,
            text: data.text,
            media: data.media || "",
            status: "sent"
        });

        const savedMsg = await newMessage.save();

        // Send to receiver
        if (onlineUsers[data.receiver]) {
            io.to(onlineUsers[data.receiver]).emit("receiveMessage", savedMsg);
        }

        // Send back to sender
        socket.emit("receiveMessage", savedMsg);
    });

    // Seen
    socket.on("messageSeen", async (messageId) => {
        await Message.findByIdAndUpdate(messageId, { status: "seen" });
        io.emit("messageSeenUpdate", messageId);
    });

    // Disconnect
    socket.on("disconnect", () => {
        for (let userId in onlineUsers) {
            if (onlineUsers[userId] === socket.id) {
                delete onlineUsers[userId];
            }
        }
        io.emit("onlineUsers", onlineUsers);
        console.log("User disconnected");
    });
});

/* ================== Routes ================== */

// Get all messages
app.get("/api/messages/:sender/:receiver", async (req, res) => {
    const { sender, receiver } = req.params;

    const messages = await Message.find({
        $or: [
            { sender, receiver },
            { sender: receiver, receiver: sender }
        ]
    }).sort({ createdAt: 1 });

    res.json(messages);
});

// Upload Image/Video
app.post("/api/upload", upload.single("file"), (req, res) => {
    res.json({
        filePath: `http://localhost:5000/uploads/${req.file.filename}`
    });
});

/* ================== Start Server ================== */
server.listen(5000, () => {
    console.log("Server running on port 5000");
});
