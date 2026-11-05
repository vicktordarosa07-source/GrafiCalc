import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "public", "legacy");
await mkdir(target, { recursive: true });
for (const file of ["app.mjs", "calculation-base.mjs", "input-format.mjs", "number-input.mjs", "styles.css", "catalogo-loja.seed.js", "catalogo-loja.seed.mjs", "legacy-bootstrap.mjs"]) {
  await cp(path.join(root, file), path.join(target, file));
}
await cp(path.join(root, "assets"), path.join(target, "assets"), { recursive: true, force: true });
const sourceHtml = await readFile(path.join(root, "index.html"), "utf8");
const legacyBootstrap = `<script defer src="./sync-recovery.js"></script>
<script defer src="./legacy-auth-bridge.mjs?v=20260917-dev-access-fix"></script>
<script defer src="./legacy-bootstrap.mjs?v=20261105-csp-bootstrap-fix"></script>`;
const html = sourceHtml.replace(
  /<script(?:\s+type="module")?\s+(?:defer\s+)?src="\.\/app\.mjs[^>]*><\/script>/i,
  legacyBootstrap
);
await writeFile(path.join(target, "index.html"), html, "utf8");
