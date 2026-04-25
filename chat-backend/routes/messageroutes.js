const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// Send message
router.post("/send", async (req, res) => {
  const { sender, text } = req.body;

  const newMessage = new Message({ sender, text });
  await newMessage.save();

  res.json(newMessage);
});

// Get messages
router.get("/all", async (req, res) => {
  const messages = await Message.find();
  res.json(messages);
});

module.exports = router;