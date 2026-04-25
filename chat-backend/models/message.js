const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    text: String,
    media: String,
    status: {
        type: String,
        default: "sent"
    }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
