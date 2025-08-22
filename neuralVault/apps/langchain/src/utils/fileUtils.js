import fs from "fs/promises";
import path from "path";
import { logger } from "./logger.js";

export class FileUtils {
  static async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      logger.info(`Created directory: ${dirPath}`);
    }
  }

  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async readFile(filePath) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      logger.debug(`Read file: ${filePath}`);
      return content;
    } catch (error) {
      logger.error(`Failed to read file: ${filePath}`, error);
      throw error;
    }
  }

  static async writeFile(filePath, content) {
    try {
      await this.ensureDirectoryExists(path.dirname(filePath));
      await fs.writeFile(filePath, content, "utf-8");
      logger.debug(`Written file: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to write file: ${filePath}`, error);
      throw error;
    }
  }

  static async copyFile(sourcePath, destPath) {
    try {
      await this.ensureDirectoryExists(path.dirname(destPath));
      await fs.copyFile(sourcePath, destPath);
      logger.debug(`Copied file: ${sourcePath} -> ${destPath}`);
    } catch (error) {
      logger.error(`Failed to copy file: ${sourcePath} -> ${destPath}`, error);
      throw error;
    }
  }

  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.debug(`Deleted file: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to delete file: ${filePath}`, error);
      throw error;
    }
  }

  static async listFiles(dirPath, extension = null) {
    try {
      const files = await fs.readdir(dirPath);
      let filteredFiles = files;

      if (extension) {
        filteredFiles = files.filter(
          (file) => path.extname(file).toLowerCase() === extension.toLowerCase()
        );
      }

      return filteredFiles.map((file) => path.join(dirPath, file));
    } catch (error) {
      logger.error(`Failed to list files in: ${dirPath}`, error);
      throw error;
    }
  }

  static async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      logger.error(`Failed to get file stats: ${filePath}`, error);
      throw error;
    }
  }

  static getFileExtension(filePath) {
    return path.extname(filePath).toLowerCase();
  }

  static getFileName(filePath) {
    return path.basename(filePath);
  }

  static getFileNameWithoutExtension(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }

  static async createBackup(filePath) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    await this.copyFile(filePath, backupPath);
    return backupPath;
  }

  static async saveJson(filePath, data) {
    const jsonContent = JSON.stringify(data, null, 2);
    await this.writeFile(filePath, jsonContent);
  }

  static async loadJson(filePath) {
    const content = await this.readFile(filePath);
    return JSON.parse(content);
  }

  static async appendToFile(filePath, content) {
    try {
      await fs.appendFile(filePath, content + "\n", "utf-8");
      logger.debug(`Appended to file: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to append to file: ${filePath}`, error);
      throw error;
    }
  }
}
