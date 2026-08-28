import { spawn } from "node:child_process";
import process from "node:process";

// Use the Windows certificate store so local Next requests can reach Supabase.
const nodeOptions = [process.env.NODE_OPTIONS, "--use-system-ca"].filter(Boolean).join(" ");
const port = process.env.PORT || "3210";
const next = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "dev", "--hostname", "0.0.0.0", "--port", port], {
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
  stdio: "inherit",
});

next.on("exit", (code) => process.exit(code ?? 0));
