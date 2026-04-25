import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000");
const API = "http://localhost:5000";

export default function App() {
  const [myId, setMyId] = useState("user1");
  const [otherId, setOtherId] = useState("user2");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typing, setTyping] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    socket.emit("userOnline", myId);

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 2000);
    });

    socket.on("messageSeenUpdate", (id) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === id ? { ...msg, status: "seen" } : msg
        )
      );
    });

    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const res = await axios.get(
      `${API}/api/messages/${myId}/${otherId}`
    );
    setMessages(res.data);
  };

  const sendMessage = async () => {
    let mediaUrl = "";

    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await axios.post(
        `${API}/api/upload`,
        formData
      );
      mediaUrl = uploadRes.data.filePath;
    }

    socket.emit("sendMessage", {
      sender: myId,
      receiver: otherId,
      text: message,
      media: mediaUrl
    });

    setMessage("");
    setFile(null);
  };

  const handleTyping = () => {
    socket.emit("typing", { sender: myId, receiver: otherId });
  };

  const markSeen = (id) => {
    socket.emit("messageSeen", id);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Chat App</h2>

      <p>
        Status: {onlineUsers[otherId] ? "🟢 Online" : "🔴 Offline"}
      </p>

      <div style={{ border: "1px solid black", height: 300, overflowY: "scroll" }}>
        {messages.map((msg) => (
          <div key={msg._id} onClick={() => markSeen(msg._id)}>
            <p>
              <b>{msg.sender}:</b> {msg.text}
            </p>

            {msg.media && (
              msg.media.includes(".mp4") ? (
                <video src={msg.media} width="200" controls />
              ) : (
                <img src={msg.media} width="200" alt="media" />
              )
            )}

            <small>
              {new Date(msg.createdAt).toLocaleTimeString()} | {msg.status}
            </small>
          </div>
        ))}
      </div>

      {typing && <p>Typing...</p>}

      <input
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          handleTyping();
        }}
        placeholder="Type message"
      />

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
