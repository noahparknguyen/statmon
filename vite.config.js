import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Vitest reads its config from here, and the `node` environment is the
  // deliberate part: there is no jsdom and no component-testing library.
  //
  // Most tests are pure logic — the stat math, the codec, the dex sort/filter,
  // both games' generators, the ability table — but `routes.test.jsx` also
  // server-renders every route with `react-dom/server` and asserts on the
  // markup, which needs no DOM either. What that CANNOT answer is anything
  // about layout, scroll or paint, and those are not "verified by hand" as this
  // comment used to claim: `npm run sweep:widths` measures them in headless
  // Chrome across 29 routes x 14 widths, and `audit:contrast` computes every
  // colour pairing.
  test: {
    environment: "node",
    include: ["src/**/*.test.{js,jsx}"],
  },
});
