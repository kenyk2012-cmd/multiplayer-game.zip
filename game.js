const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");

const protocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${protocol}//${location.host}`);

let myId = null;
let players = [];
const keys = {};

addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
});

addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

socket.onopen = () => {
  status.textContent = "Connected — multiplayer is active!";
};

socket.onclose = () => {
  status.textContent = "Disconnected from server.";
};

socket.onmessage = event => {
  const data = JSON.parse(event.data);

  if (data.type === "welcome") {
    myId = data.id;
    players = data.players;
  }

  if (data.type === "players") {
    players = data.players;
  }
};

function update() {
  const me = players.find(p => p.id === myId);
  if (!me || socket.readyState !== WebSocket.OPEN) return;

  const speed = 4;
  let x = me.x;
  let y = me.y;

  if (keys["arrowleft"] || keys["a"]) x -= speed;
  if (keys["arrowright"] || keys["d"]) x += speed;
  if (keys["arrowup"] || keys["w"]) y -= speed;
  if (keys["arrowdown"] || keys["s"]) y += speed;

  if (x !== me.x || y !== me.y) {
    socket.send(JSON.stringify({ type: "move", x, y }));
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const p of players) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = p.id === myId ? "#22cc66" : "#4488ff";
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(p.id === myId ? "YOU" : "PLAYER", p.x, p.y - 25);
  }

  requestAnimationFrame(draw);
}

setInterval(update, 30);
draw();
