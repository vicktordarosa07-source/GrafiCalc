import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "public", "legacy");
await mkdir(target, { recursive: true });
for (const file of ["app.mjs", "styles.css", "catalogo-loja.seed.js", "catalogo-loja.seed.mjs"]) {
  await cp(path.join(root, file), path.join(target, file));
}
await cp(path.join(root, "assets"), path.join(target, "assets"), { recursive: true, force: true });
const sourceHtml = await readFile(path.join(root, "index.html"), "utf8");
const legacyBootstrap = `<script defer src="./legacy-auth-bridge.mjs?v=20260827-permission-migration"></script>
  <script>
    window.addEventListener("DOMContentLoaded", async () => {
      try {
        await window.grafiCalcLegacyAuthReady;
        const appScript = document.createElement("script");
        appScript.src = "./app.mjs?v=20260827-permission-migration";
        document.body.appendChild(appScript);
      } catch (error) {
        console.error("Nao foi possivel preparar a sessao do GrafiCalc.", error);
      }
    });
  </script>`;
const html = sourceHtml.replace(
  /<script(?:\s+type="module")?\s+(?:defer\s+)?src="\.\/app\.mjs[^>]*><\/script>/i,
  legacyBootstrap
);
await writeFile(path.join(target, "index.html"), html, "utf8");
