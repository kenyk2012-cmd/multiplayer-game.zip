const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

const players = new Map();
let nextId = 1;

function broadcast(data) {
  const message = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  }
}

wss.on("connection", (socket) => {
  const id = String(nextId++);
  const player = {
    id,
    x: 400 + Math.random() * 200,
    y: 250 + Math.random() * 100
  };

  players.set(id, player);
  socket.send(JSON.stringify({ type: "welcome", id, players: [...players.values()] }));
  broadcast({ type: "players", players: [...players.values()] });

  socket.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "move") {
        const p = players.get(id);
        if (!p) return;

        p.x = Math.max(15, Math.min(785, Number(msg.x) || p.x));
        p.y = Math.max(15, Math.min(585, Number(msg.y) || p.y));

        broadcast({ type: "players", players: [...players.values()] });
      }
    } catch (_) {}
  });

  socket.on("close", () => {
    players.delete(id);
    broadcast({ type: "players", players: [...players.values()] });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Multiplayer game running on port ${PORT}`);
});
