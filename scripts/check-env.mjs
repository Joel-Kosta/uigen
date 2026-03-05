import chalk from "chalk";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
const envPath = resolve(__dirname, "../.env");
try {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=");
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
} catch {
  console.warn(chalk.yellow("Warning: Could not read .env file"));
}

const vars = [
  {
    key: "ANTHROPIC_API_KEY",
    required: false,
    description: "Anthropic API key for AI generation (optional — uses mock if missing)",
  },
  {
    key: "JWT_SECRET",
    required: false,
    description: "JWT signing secret (defaults to development-secret-key if missing)",
  },
  {
    key: "NODE_ENV",
    required: false,
    description: "Node environment (development / production)",
  },
];

console.log(chalk.bold("\n Checking environment variables...\n"));

let hasWarnings = false;

for (const { key, required, description } of vars) {
  const value = process.env[key];
  const isEmpty = !value || value.trim() === '""' || value.trim() === "";

  if (isEmpty && required) {
    console.log(
      chalk.red("  MISSING ") + chalk.bold(key) + chalk.gray(`  — ${description}`)
    );
    hasWarnings = true;
  } else if (isEmpty && !required) {
    console.log(
      chalk.yellow("  UNSET   ") + chalk.bold(key) + chalk.gray(`  — ${description}`)
    );
  } else {
    const display =
      key.toLowerCase().includes("key") || key.toLowerCase().includes("secret")
        ? chalk.gray("[set]")
        : chalk.green(value);
    console.log(
      chalk.green("  OK      ") + chalk.bold(key) + "  " + display + chalk.gray(`  — ${description}`)
    );
  }
}

console.log();

if (hasWarnings) {
  console.log(chalk.red.bold("  Some required variables are missing. Please check your .env file.\n"));
  process.exit(1);
} else {
  console.log(chalk.green.bold("  All required variables are set.\n"));
}
