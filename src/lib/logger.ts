import chalk from "chalk";

const timestamp = () => chalk.gray(`[${new Date().toISOString()}]`);

export const logger = {
  info: (msg: string, ...args: any[]) =>
    console.log(timestamp(), chalk.cyan("INFO"), msg, ...args),

  success: (msg: string, ...args: any[]) =>
    console.log(timestamp(), chalk.green("OK  "), msg, ...args),

  warn: (msg: string, ...args: any[]) =>
    console.warn(timestamp(), chalk.yellow("WARN"), msg, ...args),

  error: (msg: string, ...args: any[]) =>
    console.error(timestamp(), chalk.red("ERR "), msg, ...args),
};
