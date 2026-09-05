import { access } from "node:fs/promises";
import { constants } from "node:fs";

// Finds a usable Chrome for the two scripts that drive a headless browser
// (`sweep-widths.mjs`, `shoot-docs.mjs`).
//
// It exists because the first version of this was a fake: both scripts carried
// `["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable"].find(Boolean)`,
// which returns the first truthy *string* — always index 0 — and never checks
// whether anything is there. A candidate list that cannot fall back is worse
// than a hardcoded path, because it reads as if it handles the case.
//
// Shared rather than copied into both, for the reason 06_style_guide §12 rule 8
// gives about component styles: two copies of a lookup are two chances to fix
// only one of them.
const CANDIDATES = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
  // macOS, for anyone running these outside CI.
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

export async function findChrome() {
  // An explicit override wins, and is trusted: if someone sets CHROME_PATH to
  // something broken, the spawn error naming their path is the clearest
  // possible message.
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  for (const candidate of CANDIDATES) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      /* try the next one */
    }
  }
  return null;
}

// Resolve or exit with something actionable. Both callers are developer tools,
// so failing with a stack trace from `spawn ENOENT` helps nobody.
export async function requireChrome(script) {
  const chrome = await findChrome();
  if (chrome) return chrome;
  console.error(
    `${script} needs a Chrome binary and could not find one.\n` +
      `Looked in:\n${CANDIDATES.map((c) => `  ${c}`).join("\n")}\n` +
      `Set CHROME_PATH=/path/to/chrome to point at yours.`,
  );
  process.exit(1);
}
