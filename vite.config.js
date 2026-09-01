import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Vitest reads its config from here. Tests cover pure logic only — the stat
  // math, the dataset codec, and the dex table's sort/filter — so they need no
  // DOM, no jsdom, and no component-testing library. Anything that needs a
  // browser is verified by hand against the running app instead.
  test: {
    environment: "node",
    include: ["src/**/*.test.{js,jsx}"],
  },
});
