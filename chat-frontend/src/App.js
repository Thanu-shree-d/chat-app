import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000");

function App() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [online, setOnline] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/messages")
      .then(res => setMessages(res.data));

    socket.on("receiveMessage", (data) => {
      setMessages(prev => [...prev, data]);
    });

    socket.on("onlineUsers", (users) => {
      setOnline(users);
    });
  }, []);

  const join = () => {
    socket.emit("join", name);
  };

  const send = () => {
    const data = {
      text: msg,
      sender: name,
      time: new Date().toLocaleTimeString()
    };

    socket.emit("sendMessage", data);
    setMsg("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>💬 Chat App</h2>

      <input
        placeholder="Enter name"
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={join}>Join</button>

      <h4>🟢 Online Users: {online.join(", ")}</h4>

      <div style={{ height: 300, overflow: "auto", border: "1px solid gray", padding: 10 }}>
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.sender}</b>: {m.text}
            <small> ({m.time})</small>
          </div>
        ))}
      </div>

      <input
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Type message"
      />
      <button onClick={send}>Send</button>
    </div>
  );
}

export default App;