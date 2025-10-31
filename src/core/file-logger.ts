/**
 * File logging module for handling log file operations
 */

import { writeFileSync, existsSync, mkdirSync, statSync, unlinkSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { LogEntry, FileLoggerConfig } from './logger-types';

// Constants for file operations
const MAX_FILE_SIZE_MB = 10;
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = 1024;
const DEFAULT_MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * BYTES_PER_KB * BYTES_PER_MB; // 10MB
const DEFAULT_MAX_FILES = 5;

/**
 * File logger that handles log file operations and rotation
 */
export class FileLogger {
  private config: FileLoggerConfig;

  /**
   * Creates a new file logger
   * @param {FileLoggerConfig} config - File logger configuration
   */
  constructor(config: FileLoggerConfig) {
    this.config = config;
  }

  /**
   * Initialize file logging with directory and file creation
   */
  initializeFileLogging(): void {
    if (!this.config.enabled || !this.config.logFile) {
      return;
    }

    try {
      const logDir = join(process.cwd(), 'logs');
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }

      if (!this.config.logFile.includes('/')) {
        this.config.logFile = join(logDir, this.config.logFile);
      }

      const logFileDir = join(this.config.logFile, '..');
      if (!existsSync(logFileDir)) {
        mkdirSync(logFileDir, { recursive: true });
      }

      if (!existsSync(this.config.logFile)) {
        writeFileSync(this.config.logFile, '', { flag: 'w' });
      }
    } catch {
      // Disable file logging if we can't create the file
      this.config.enabled = false;
    }
  }

  /**
   * Log to file with rotation support
   * @param {LogEntry} entry - The log entry to write to file
   */
  logToFile(entry: LogEntry): void {
    if (!this.config.enabled || !this.config.logFile) {
      return;
    }

    try {
      // Check file size and rotate if necessary
      this.rotateLogFileIfNeeded();

      const logLine = `${JSON.stringify(entry)}\n`;
      writeFileSync(this.config.logFile, logLine, { flag: 'a' });
    } catch {
      // Silently handle file write errors to avoid infinite loops
      // Could consider using a fallback logging mechanism here
    }
  }

  /**
   * Rotate log file if it exceeds size limit
   */
  private rotateLogFileIfNeeded(): void {
    if (!this.config.enabled || !this.config.logFile) {
      return;
    }

    try {
      const stats = this.getFileStats(this.config.logFile);

      if (stats && stats.size > (this.config.maxFileSize || DEFAULT_MAX_FILE_SIZE_BYTES)) {
        this.rotateLogFiles();
        this.moveCurrentFileToBackup();
      }
    } catch {
      // Silently handle rotation errors to avoid infinite loops
    }
  }

  /**
   * Get file statistics safely
   * @param {string} filePath - Path to the file to get stats for
   * @returns {{ size: number } | null} File stats or null if file doesn't exist
   * @private
   */
  private getFileStats(filePath: string): { size: number } | null {
    return existsSync(filePath) ? statSync(filePath) : null;
  }

  /**
   * Rotate existing log files by incrementing their numbers
   */
  private rotateLogFiles(): void {
    if (!this.config.enabled || !this.config.logFile) {
      return;
    }

    const maxFiles = this.config.maxFiles || DEFAULT_MAX_FILES;

    for (let i = maxFiles; i > 1; i--) {
      const oldFile = `${this.config.logFile}.${i - 1}`;
      const newFile = `${this.config.logFile}.${i}`;

      if (existsSync(oldFile)) {
        this.moveFileIfExists(oldFile, newFile);
      }
    }
  }

  /**
   * Move current log file to backup position (.1)
   */
  private moveCurrentFileToBackup(): void {
    if (!this.config.enabled || !this.config.logFile) {
      return;
    }

    const backupFile = `${this.config.logFile}.1`;

    if (existsSync(backupFile)) {
      unlinkSync(backupFile);
    }

    renameSync(this.config.logFile, backupFile);
  }

  /**
   * Move file from source to destination, removing destination if it exists
   * @param {string} sourceFile - Source file path
   * @param {string} destinationFile - Destination file path
   * @private
   */
  private moveFileIfExists(sourceFile: string, destinationFile: string): void {
    if (existsSync(destinationFile)) {
      unlinkSync(destinationFile);
    }
    renameSync(sourceFile, destinationFile);
  }

  /**
   * Clear all log files including rotated versions
   */
  clearLogs(): void {
    if (!this.config.enabled || !this.config.logFile) {
      return;
    }

    try {
      const maxFiles = this.config.maxFiles || DEFAULT_MAX_FILES;

      for (let i = 1; i <= maxFiles; i++) {
        const logFile = `${this.config.logFile}.${i}`;
        if (existsSync(logFile)) {
          unlinkSync(logFile);
        }
      }

      if (existsSync(this.config.logFile)) {
        unlinkSync(this.config.logFile);
      }
    } catch {
      // Silently handle clear log files errors to avoid infinite loops
    }
  }

  /**
   * Update file logger configuration
   * @param {Partial<FileLoggerConfig>} config - Partial configuration to merge
   */
  updateConfig(config: Partial<FileLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current file logger configuration
   * @returns {FileLoggerConfig} Current configuration
   */
  getConfig(): FileLoggerConfig {
    return { ...this.config };
  }
}
