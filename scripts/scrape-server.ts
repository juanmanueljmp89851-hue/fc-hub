import http from "node:http";
import { exec } from "node:child_process";

const PORT = parseInt(process.env.PORT ?? "3001");
const SCRAPE_SECRET = process.env.SCRAPE_SECRET ?? "";

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/health" && req.method === "GET") {
    res.end(JSON.stringify({ ok: true, ts: new Date().toISOString() }));
    return;
  }

  if (req.url === "/scrape" && req.method === "POST") {
    if (SCRAPE_SECRET && req.headers.authorization !== `Bearer ${SCRAPE_SECRET}`) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }

    res.writeHead(202);
    res.end(JSON.stringify({ status: "started", ts: new Date().toISOString() }));

    console.log(`[${new Date().toISOString()}] Scrape triggered`);
    exec(
      "npx tsx scripts/scrape-futbin.ts --rotate --pages 2",
      { timeout: 600_000, env: process.env },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`[SCRAPE FAILED] ${error.message}`);
          console.error(stderr);
        } else {
          console.log(stdout);
        }
        console.log(`[${new Date().toISOString()}] Scrape finished`);
      }
    );
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  console.log(`Scraper server listening on :${PORT}`);
});
