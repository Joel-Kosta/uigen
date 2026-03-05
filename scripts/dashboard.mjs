import chalk from "chalk";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ─── Load .env ───────────────────────────────────────────────────────────────
const envPath = resolve(root, ".env");
try {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=");
    if (key && !(key in process.env)) process.env[key] = value;
  }
} catch {}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const WIDTH = 52;

const box = (title, lines) => {
  const top    = chalk.gray("┌─ ") + chalk.bold.white(title) + chalk.gray(" " + "─".repeat(WIDTH - title.length - 4) + "┐");
  const bottom = chalk.gray("└" + "─".repeat(WIDTH) + "┘");
  const body   = lines.map(l => chalk.gray("│") + " " + l + chalk.gray("│")).join("\n");
  return [top, body, bottom].join("\n");
};

const pad = (str, len) => {
  const plain = str.replace(/\x1B\[[0-9;]*m/g, "");
  return str + " ".repeat(Math.max(0, len - plain.length));
};

const ok   = (label, value = "") => pad(chalk.green("  ✓ ") + chalk.bold(label), 38) + pad(value, WIDTH - 38 + label.length - label.length);
const warn = (label, value = "") => pad(chalk.yellow("  ⚠ ") + chalk.bold(label), 38) + pad(value, WIDTH - 38 + label.length - label.length);
const fail = (label, value = "") => pad(chalk.red("  ✗ ") + chalk.bold(label), 38) + pad(value, WIDTH - 38 + label.length - label.length);

// ─── Checks ──────────────────────────────────────────────────────────────────
const envVars = [
  { key: "ANTHROPIC_API_KEY", label: "ANTHROPIC_API_KEY", required: false, secret: true },
  { key: "JWT_SECRET",        label: "JWT_SECRET",        required: false, secret: true },
  { key: "NODE_ENV",          label: "NODE_ENV",          required: false, secret: false },
];

const envLines = envVars.map(({ key, label, required, secret }) => {
  const value = process.env[key];
  const empty = !value || value.trim() === "" || value.trim() === '""';
  const display = secret ? chalk.gray("[set]") : chalk.cyan(value || "");
  if (empty && required) return fail(label, chalk.red("missing"));
  if (empty)             return warn(label, chalk.gray("unset"));
  return ok(label, display);
});

const dbPath   = resolve(root, "prisma/dev.db");
const dbExists = existsSync(dbPath);
const dbLines  = [
  dbExists ? ok("SQLite database", chalk.cyan("prisma/dev.db")) : fail("SQLite database", chalk.red("not found")),
  dbExists ? ok("Migrations",      chalk.gray("in sync"))       : warn("Migrations",      chalk.yellow("run npm run setup")),
];

let serverStatus = "unknown";
try {
  const res = await fetch("http://localhost:3000", { signal: AbortSignal.timeout(2000) });
  serverStatus = res.ok || res.status < 500 ? "running" : "error";
} catch {
  serverStatus = "offline";
}

const serverLines = [
  serverStatus === "running"
    ? ok("Next.js server", chalk.cyan("http://localhost:3000"))
    : serverStatus === "offline"
    ? warn("Next.js server", chalk.yellow("not running — npm run dev"))
    : fail("Next.js server", chalk.red("error")),
  ok("Network",       chalk.cyan("http://100.115.92.200:3000")),
];

const pkg      = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
const infoLines = [
  ok("App",     chalk.cyan(pkg.name) + chalk.gray("  v" + pkg.version)),
  ok("Next.js", chalk.cyan(pkg.dependencies.next)),
  ok("Prisma",  chalk.cyan(pkg.dependencies["@prisma/client"])),
  ok("Node",    chalk.cyan(process.version)),
];

// ─── Render ──────────────────────────────────────────────────────────────────
const banner = [
  chalk.bold.cyan("  ██╗   ██╗██╗ ██████╗ ███████╗███╗   ██╗"),
  chalk.bold.cyan("  ██║   ██║██║██╔════╝ ██╔════╝████╗  ██║"),
  chalk.bold.cyan("  ██║   ██║██║██║  ███╗█████╗  ██╔██╗ ██║"),
  chalk.bold.cyan("  ██║   ██║██║██║   ██║██╔══╝  ██║╚██╗██║"),
  chalk.bold.cyan("  ╚██████╔╝██║╚██████╔╝███████╗██║ ╚████║"),
  chalk.bold.cyan("   ╚═════╝ ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝"),
  chalk.gray("  CLI Dashboard  ·  " + new Date().toLocaleString()),
].join("\n");

console.log("\n" + banner + "\n");
console.log(box("App Info",    infoLines));
console.log();
console.log(box("Environment", envLines));
console.log();
console.log(box("Database",    dbLines));
console.log();
console.log(box("Server",      serverLines));
console.log();
