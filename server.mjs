import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url)).replace(/[\\/]+$/, "");
const mimeTypes = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json" };
const server = createServer(async (request, response) => {
  let requestedPath;
  try {
    const requestPath = request.url.split("?")[0];
    requestedPath = requestPath === "/" ? "/index.html" : decodeURIComponent(requestPath);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }
  const filePath = normalize(join(root, requestedPath));
  if (filePath !== root && !filePath.startsWith(root + sep)) { response.writeHead(403); response.end("Forbidden"); return; }
  try { const content = await readFile(filePath); response.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" }); response.end(content); }
  catch { response.writeHead(404); response.end("Not found"); }
});
server.listen(8178, () => console.log("Skull Leader v0 running at http://localhost:8178"));
