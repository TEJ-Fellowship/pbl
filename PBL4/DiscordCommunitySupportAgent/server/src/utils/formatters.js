class Formatters {
  static formatError(message) {
    return `❌ ${message}`;
  }

  static formatSuccess(message) {
    return `✅ ${message}`;
  }

  static formatWarning(message) {
    return `⚠️ ${message}`;
  }

  static formatInfo(message) {
    return `ℹ️ ${message}`;
  }

  static formatHeader(message) {
    return `\n🔹 ${message} 🔹\n`;
  }
}

export default Formatters;
