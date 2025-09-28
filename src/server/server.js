const WebSocket = require("ws");
const { PumpChatClient } = require("pump-chat-client");

const token = "5GAPXwP4dpELAeHCEPoDM6ZPPec4gCULXPga2FDp6UwE";

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Фронт подключился к WebSocket");
});

async function main() {
  const client = new PumpChatClient({
    roomId: token,
    messageHistoryLimit: 50,
    autoReconnect: false,
  });

  client.on("connected", () => {
    console.log("Подключён к чату:", token);
  });

  client.on("messageHistory", (messages) => {
    messages.forEach((msg) => {
      const payload = {
        user: msg.username || msg.user || msg.author,
        text: msg.message || msg.content,
        isHistory: true,
      };
      // wss.clients.forEach((ws) => {
      //   if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
      // });
      console.log(`[HIST] ${payload.user}: ${payload.text}`);
    });
  });

  client.on("message", (msg) => {
    const payload = {
      user: msg.username || msg.user || msg.author,
      text: msg.message || msg.content,
      isHistory: false,
    };
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
    });
    console.log(`[NEW] ${payload.user}: ${payload.text}`);
  });

  client.on("error", (err) => {
    console.error("error:", err);
  });

  await client.connect();
  console.log("PumpFun WS bridge running on ws://localhost:8080");
}

main().catch(console.error);
