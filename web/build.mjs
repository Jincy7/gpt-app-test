import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes("--watch");

const widgets = ["usage-widget", "bill-widget", "plan-widget", "roaming-widget"];

async function build() {
  for (const widget of widgets) {
    const result = await esbuild.build({
      entryPoints: [resolve(__dirname, `src/${widget}.tsx`)],
      bundle: true,
      format: "esm",
      write: false,
      minify: true,
      jsx: "automatic",
      jsxImportSource: "react",
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    });

    const js = result.outputFiles[0].text;

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${widget}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module">${js}</script>
</body>
</html>`;

    mkdirSync(resolve(__dirname, "dist"), { recursive: true });
    writeFileSync(resolve(__dirname, `dist/${widget}.html`), html);
    console.log(`Built ${widget}.html`);
  }
}

if (isWatch) {
  const chokidar = await import("chokidar").catch(() => null);
  if (chokidar) {
    chokidar.watch(resolve(__dirname, "src")).on("change", () => {
      build().catch(console.error);
    });
    console.log("Watching for changes...");
  }
  await build();
} else {
  await build();
}
