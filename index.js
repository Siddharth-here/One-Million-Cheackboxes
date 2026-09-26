import http from "node:http";
import path from "node:path";

import express from "express";
import { Server } from "socket.io";
import { publisher, subscriber } from "./redis-connection.js";
import { channel } from "node:diagnostics_channel";

const CHECKBOX_SIZE = 100;
const state = {
  checkboxes: new Array(CHECKBOX_SIZE).fill(false),
};

async function main() {
  const PORT = process.env.PORT ?? 8000;

  const app = express();
  const server = http.createServer(app);

  const io = new Server();
  io.attach(server);

  subscriber.subscribe("internal-server:checkbox:change");
  subscriber.on("message", (channel, message) => {
    if (channel === "internal-server:checkbox:change") {
      const { index, checked } = JSON.parse(message);
      state.checkboxes[index] = checked;
      io.emit("server:checkbox:change",{ index, checked });
    }
  });

  //Socket IO Handler
  io.on("connection", (socket) => {
    console.log(`socket connected`, { id: socket.id });

    socket.on("client:checkbox:change", async (data) => {
      console.log(`[Socket:${socket.id}]:client:checkbox:change`, data);
      // io.emit("server:checkbox:change", data);
      // state.checkboxes[data.index] = data.checked;

      await publisher.publish(
        "internal-server:checkbox:change",
        JSON.stringify(data),
      );
    });
  });

  //Express Handler
  app.get("/health", (req, res) => res.json({ healty: true }));

  app.use(express.static(path.resolve("./public"))); //middleware tells if the files is in public folder then show it to user

  app.get("/checkboxes", (req, res) => {
    return res.json({ checkboxes: state.checkboxes });
  });

  server.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
  });
}

main();
