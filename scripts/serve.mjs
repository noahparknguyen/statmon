import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Serves the built site to the three scripts that drive a headless browser:
// `sweep-widths.mjs`, `shoot-docs.mjs`, and `shoot-phone.mjs`. It answers the
// way Cloudflare does (wrangler.jsonc), with a file if one exists and
// index.html for any other path, so a deep link boots the app.
//
// Shared rather than copied into each, for the reason `chrome.mjs` is: two
// copies of a server are two chances to fix only one of them.

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const DIST = path.join(ROOT, "dist");

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// A path stays inside the folder it was resolved against, so a request for
// `/../package.json` can't read outside it.
const inside = (base, file) =>
  file === base || file.startsWith(base + path.sep);

// `fromRepo` lists path prefixes served from the repo itself rather than from
// dist/, which is how shoot:docs reaches its Open Graph generator in docs/ with
// its `../public/fonts` references intact. Those paths get no fallback: a
// missing generator file should fail, not quietly render the app.
//
// Resolves once the server is listening, on a free port.
export async function serveBuild({ fromRepo = [] } = {}) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);

    const candidates = fromRepo.some((prefix) => pathname.startsWith(prefix))
      ? [[ROOT, path.join(ROOT, pathname)]]
      : [
          [DIST, path.join(DIST, pathname)],
          [DIST, path.join(DIST, "index.html")],
        ];

    for (const [base, file] of candidates) {
      if (!inside(base, file)) continue;
      try {
        const body = await readFile(file);
        res.writeHead(200, {
          "Content-Type": MIME[path.extname(file)] ?? "text/plain",
        });
        return res.end(body);
      } catch {
        /* a folder or a missing file: try the fallback */
      }
    }
    res.writeHead(404).end("not found");
  });

  const port = await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => server.close(),
  };
}
