import { mkdir, cp, copyFile } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await cp("assets", "dist/assets", { recursive: true, force: true });
await copyFile("index.html", "dist/index.html");
await copyFile("manifest.webmanifest", "dist/manifest.webmanifest");
await copyFile("sw.js", "dist/sw.js");

console.log("MCPS invoice v10 test build complete");
