import http from "node:http";
import express from "express";

async function main() {
  const app = express();
  const server = http.createServer();
  const PORT = process.env.PORT ?? 8000;

  app.get("/health", (req, res) => res.json({ healty: true }));

  server.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
  });
}

main()