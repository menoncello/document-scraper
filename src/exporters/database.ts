export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql' | 'mysql';
  connection: {
    filename?: string; // SQLite
    host?: string; // PostgreSQL/MySQL
    port?: number; // PostgreSQL/MySQL
    database?: string; // PostgreSQL/MySQL
    username?: string; // PostgreSQL/MySQL
    password?: string; // PostgreSQL/MySQL
    ssl?: boolean; // PostgreSQL/MySQL
  };
  table?: string;
  createTable?: boolean;
}

export interface DatabaseExportOptions {
  tableName?: string;
  createTableIfNotExists?: boolean;
  batchSize?: number;
  conflictResolution?: 'ignore' | 'replace' | 'update';
}

export interface TableSchema {
  columns: Array<{ name: string; type: string; nullable: boolean }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export type DatabaseRecord = Record<string, unknown>;
export type DatabaseData = DatabaseRecord | DatabaseRecord[];

/**
 * Validates database configuration for each database type
 * @param {DatabaseConfig} config - The database configuration to validate
 * @returns {string[]} Array of validation error messages
 */
function validateDatabaseTypeConfig(config: DatabaseConfig): string[] {
  const errors: string[] = [];

  if (!['sqlite', 'postgresql', 'mysql'].includes(config.type)) {
    errors.push(`Invalid database type: ${config.type}. Must be sqlite, postgresql, or mysql`);
    return errors;
  }

  if (config.type === 'sqlite') {
    if (!config.connection.filename) {
      errors.push('SQLite requires connection.filename');
    }
  } else {
    // PostgreSQL and MySQL requirements
    if (!config.connection.host) {
      errors.push(`${config.type} requires connection.host`);
    }
    if (!config.connection.database) {
      errors.push(`${config.type} requires connection.database`);
    }
    if (!config.connection.username) {
      errors.push(`${config.type} requires connection.username`);
    }
  }

  return errors;
}

/**
 * Determines if a string represents a numeric value
 * @param {string} value - The string to analyze
 * @returns {boolean} True if the string represents a numeric value
 */
function isNumericString(value: string): boolean {
  return !Number.isNaN(Number(value)) && value.trim() !== '';
}

/**
 * Determines if a string represents a date value
 * @param {string} value - The string to analyze
 * @returns {boolean} True if the string represents a valid date
 */
function isDateString(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

/**
 * Determines database type for numeric values
 * @param {number} value - The numeric value to analyze
 * @returns {string} Database column type string
 */
function inferNumericType(value: number): string {
  return Number.isInteger(value) ? 'INTEGER' : 'REAL';
}

/**
 * Determines database type for string values
 * @param {string} value - The string value to analyze
 * @returns {string} Database column type string
 */
function inferStringType(value: string): string {
  if (isNumericString(value)) {
    return inferNumericType(Number(value));
  }
  if (isDateString(value)) {
    return 'TIMESTAMP';
  }
  return 'TEXT';
}

/**
 * Determines the appropriate database column type for a given value
 * @param {unknown} value - The value to analyze
 * @returns {string} Database column type string
 */
function inferDatabaseType(value: unknown): string {
  if (value === null || value === undefined) return 'TEXT';
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'number') return inferNumericType(value);
  if (value instanceof Date) return 'TIMESTAMP';
  if (typeof value === 'string') return inferStringType(value);
  return 'TEXT';
}

/**
 * Adds a column definition to the columns array
 * @param {Array<{name: string, type: string, nullable: boolean}>} columns - Array to accumulate column definitions
 * @param {string} name - Column name
 * @param {unknown} value - Column value
 */
function addColumnDefinition(
  columns: Array<{ name: string; type: string; nullable: boolean }>,
  name: string,
  value: unknown
): void {
  columns.push({
    name,
    type: inferDatabaseType(value),
    nullable: value === null || value === undefined,
  });
}

/**
 * Handles primitive value column extraction
 * @param {Array<{name: string, type: string, nullable: boolean}>} columns - Array to accumulate column definitions
 * @param {string} prefix - Column name prefix
 * @param {unknown} obj - The object value
 */
function handlePrimitiveValue(
  columns: Array<{ name: string; type: string; nullable: boolean }>,
  prefix: string,
  obj: unknown
): void {
  if (prefix) {
    addColumnDefinition(columns, prefix, obj);
  }
}

/**
 * Processes object properties and extracts column definitions
 * @param {Record<string, unknown>} obj - The object to process
 * @param {string} prefix - Column name prefix
 * @param {Array<{name: string, type: string, nullable: boolean}>} columns - Array to accumulate column definitions
 */
function processObjectProperties(
  obj: Record<string, unknown>,
  prefix: string,
  columns: Array<{ name: string; type: string; nullable: boolean }>
): void {
  for (const [key, value] of Object.entries(obj)) {
    const columnName = prefix ? `${prefix}_${key}` : key;

    if (Array.isArray(value)) {
      // For arrays, store as JSON or create a separate table
      columns.push({ name: columnName, type: 'TEXT', nullable: true });
    } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      // Nested object - recursively extract columns
      extractObjectColumns(value, columnName, columns);
    } else {
      addColumnDefinition(columns, columnName, value);
    }
  }
}

/**
 * Extracts column definitions from an object by analyzing its structure
 * @param {unknown} obj - The object to analyze
 * @param {string} prefix - Column name prefix for nested properties
 * @param {Array<{name: string, type: string, nullable: boolean}>} columns - Array to accumulate column definitions
 */
function extractObjectColumns(
  obj: unknown,
  prefix: string,
  columns: Array<{ name: string; type: string; nullable: boolean }>
): void {
  if (obj === null || typeof obj !== 'object') {
    handlePrimitiveValue(columns, prefix, obj);
    return;
  }

  processObjectProperties(obj as Record<string, unknown>, prefix, columns);
}

/**
 * Validates and normalizes input data for database export
 * @param {DatabaseData} data - Raw input data
 * @returns {DatabaseRecord[]} Normalized array of database records
 * @throws {Error} if no valid data to export
 */
function validateAndNormalizeData(data: DatabaseData): DatabaseRecord[] {
  if (!Array.isArray(data)) {
    data = [data];
  }

  if (data.length === 0) {
    throw new Error('No data to export to database');
  }

  return data;
}

/**
 * Routes data export to the appropriate database handler based on configuration
 * @param {DatabaseRecord[]} data - The data to export
 * @param {DatabaseConfig} config - Database configuration
 * @param {Required<Omit<DatabaseExportOptions, 'tableName'>>} options - Export options
 * @throws {Error} if export fails
 */
async function routeDatabaseExport(
  data: DatabaseRecord[],
  config: DatabaseConfig,
  options: Required<Omit<DatabaseExportOptions, 'tableName'>>
): Promise<void> {
  switch (config.type) {
    case 'sqlite':
      await exportToSQLite(data, config, options);
      break;
    case 'postgresql':
      await exportToPostgreSQL(data, config, options);
      break;
    case 'mysql':
      await exportToMySQL(data, config, options);
      break;
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}

/**
 * Export data to database
 * @param {DatabaseData} data - The data to export (object or array of objects)
 * @param {DatabaseConfig} config - Database configuration
 * @param {DatabaseExportOptions} options - Export options
 * @returns {Promise<void>} Promise that resolves when export is complete
 * @throws {Error} if export fails
 */
export async function exportToDatabase(
  data: DatabaseData,
  config: DatabaseConfig,
  options: DatabaseExportOptions = {}
): Promise<void> {
  const {
    createTableIfNotExists = true,
    batchSize = 1000,
    conflictResolution = 'ignore',
  } = options;

  try {
    const normalizedData = validateAndNormalizeData(data);

    await routeDatabaseExport(normalizedData, config, {
      createTableIfNotExists,
      batchSize,
      conflictResolution,
    });
  } catch (error) {
    throw new Error(
      `Failed to export to database: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Export to SQLite database
 * @param {DatabaseRecord[]} _data - The data to export (unused in placeholder implementation)
 * @param {DatabaseConfig} _config - Database configuration (unused in placeholder implementation)
 * @param {Required<Omit<DatabaseExportOptions, 'tableName'>>} _options - Export options (unused in placeholder implementation)
 * @throws {Error} indicating SQLite export is not yet implemented
 */
async function exportToSQLite(
  _data: DatabaseRecord[],
  _config: DatabaseConfig,
  _options: Required<Omit<DatabaseExportOptions, 'tableName'>>
): Promise<void> {
  // Note: This is a placeholder implementation
  // In a real implementation, you would use sqlite3 or better-sqlite3
  throw new Error(
    'SQLite export not yet implemented. Install sqlite3 package and implement connection logic.'
  );
}

/**
 * Export to PostgreSQL database
 * @param {DatabaseRecord[]} _data - The data to export (unused in placeholder implementation)
 * @param {DatabaseConfig} _config - Database configuration (unused in placeholder implementation)
 * @param {Required<Omit<DatabaseExportOptions, 'tableName'>>} _options - Export options (unused in placeholder implementation)
 * @throws {Error} indicating PostgreSQL export is not yet implemented
 */
async function exportToPostgreSQL(
  _data: DatabaseRecord[],
  _config: DatabaseConfig,
  _options: Required<Omit<DatabaseExportOptions, 'tableName'>>
): Promise<void> {
  // Note: This is a placeholder implementation
  // In a real implementation, you would use pg or postgres.js
  throw new Error(
    'PostgreSQL export not yet implemented. Install pg package and implement connection logic.'
  );
}

/**
 * Export to MySQL database
 * @param {DatabaseRecord[]} _data - The data to export (unused in placeholder implementation)
 * @param {DatabaseConfig} _config - Database configuration (unused in placeholder implementation)
 * @param {Required<Omit<DatabaseExportOptions, 'tableName'>>} _options - Export options (unused in placeholder implementation)
 * @throws {Error} indicating MySQL export is not yet implemented
 */
async function exportToMySQL(
  _data: DatabaseRecord[],
  _config: DatabaseConfig,
  _options: Required<Omit<DatabaseExportOptions, 'tableName'>>
): Promise<void> {
  // Note: This is a placeholder implementation
  // In a real implementation, you would use mysql2 or similar
  throw new Error(
    'MySQL export not yet implemented. Install mysql2 package and implement connection logic.'
  );
}

/**
 * Generate table schema from data structure
 * @param {DatabaseRecord[]} data - Array of database records to analyze
 * @returns {TableSchema} Table schema with column definitions
 */
export function generateTableSchema(data: DatabaseRecord[]): TableSchema {
  if (!Array.isArray(data) || data.length === 0) {
    return { columns: [] };
  }

  const columns: Array<{ name: string; type: string; nullable: boolean }> = [];
  const firstRow = data[0];

  extractObjectColumns(firstRow, '', columns);

  return { columns };
}

/**
 * Validate database configuration
 * @param {DatabaseConfig} config - Database configuration to validate
 * @returns {ValidationResult} Validation result with errors if any
 */
export function validateDatabaseConfig(config: DatabaseConfig): ValidationResult {
  const errors = validateDatabaseTypeConfig(config);

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
