import chalk from "chalk";
import { config } from "../config/index.js";

class Logger {
  constructor() {
    this.logLevel = config.getLogLevel();
    this.isDebug = config.isDebug();
  }

  info(message, data = null) {
    if (this.shouldLog("info")) {
      console.log(chalk.blue("ℹ️  INFO:"), message);
      if (data && this.isDebug) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      }
    }
  }

  success(message, data = null) {
    if (this.shouldLog("info")) {
      console.log(chalk.green("✅ SUCCESS:"), message);
      if (data && this.isDebug) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      }
    }
  }

  warn(message, data = null) {
    if (this.shouldLog("warn")) {
      console.log(chalk.yellow("⚠️  WARNING:"), message);
      if (data && this.isDebug) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      }
    }
  }

  error(message, error = null) {
    if (this.shouldLog("error")) {
      console.error(chalk.red("❌ ERROR:"), message);
      if (error && this.isDebug) {
        console.error(chalk.red(error.stack || error.message));
      }
    }
  }

  debug(message, data = null) {
    if (this.isDebug && this.shouldLog("debug")) {
      console.log(chalk.gray("🐛 DEBUG:"), message);
      if (data) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      }
    }
  }

  progress(message) {
    if (this.shouldLog("info")) {
      console.log(chalk.cyan("🔄"), message);
    }
  }

  table(data, title = "") {
    if (this.shouldLog("info")) {
      if (title) {
        console.log(chalk.cyan(`\n📊 ${title}`));
      }
      console.table(data);
    }
  }

  shouldLog(level) {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    return levels[level] <= levels[this.logLevel];
  }

  setLogLevel(level) {
    this.logLevel = level;
  }

  getLogLevel() {
    return this.logLevel;
  }
}

export const logger = new Logger();
