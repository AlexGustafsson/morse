import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { readFileSync } from "fs";

/** @type {import('vite').Plugin} */
const bufferLoader = {
  name: "buffer-loader",
  transform(_: any, id: string) {
    const [path, query] = id.split("?");
    if (query !== "buffer") {
      return null;
    }

    const data = readFileSync(path);
    const base64 = data.toString("base64");
    return `export default Uint8Array.from(atob("${base64}"), c => c.charCodeAt(0)).buffer;`;
  },
};

export default defineConfig({
  plugins: [react(), bufferLoader],
  root: "src",
});
