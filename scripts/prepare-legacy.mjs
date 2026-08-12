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
const html = sourceHtml.replace(/<script\s+type="module"\s+src="\.\/app\.mjs[^>]*><\/script>/i, '<script type="module" src="./legacy-auth-bridge.mjs"></script>\n    <script type="module" src="./app.mjs"></script>');
await writeFile(path.join(target, "index.html"), html, "utf8");
