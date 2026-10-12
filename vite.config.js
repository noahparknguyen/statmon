import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Vitest reads its config from here, and the `node` environment is on
  // purpose: there's no jsdom and no component-testing library.
  //
  // Most tests are pure logic (the stat maths, the codec, the dex sort and
  // filters, both games' generators, the ability table), but `routes.test.jsx`
  // also server-renders every route with `react-dom/server` and asserts on the
  // markup, which needs no DOM either. What that can't answer is anything
  // about layout, scroll, or paint: `npm run sweep:widths` measures those in
  // headless Chrome across 29 routes × 14 widths, and `audit:contrast`
  // computes every colour pairing.
  test: {
    environment: "node",
    include: ["src/**/*.test.{js,jsx}"],
  },
});
