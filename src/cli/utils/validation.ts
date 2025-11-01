/**
 * URL validation utility
 */

/**
 * Validates if a given string is a properly formatted URL with HTTP or HTTPS protocol.
 *
 * @param {string} url - The URL string to validate
 * @returns {boolean} True if the URL is valid and uses HTTP or HTTPS protocol, false otherwise
 */
export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizes a filename by replacing non-alphanumeric characters with underscores and converting to lowercase.
 * This ensures filenames are safe for file systems and consistent formatting.
 *
 * @param {string} filename - The original filename to sanitize
 * @returns {string} The sanitized filename with only alphanumeric characters and underscores
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\da-z]/gi, '_').toLowerCase();
}

/**
 * Determines the output format based on the file extension.
 * Supports JSON and CSV formats, returning undefined for unsupported extensions.
 *
 * @param {string} filename - The filename or file path to extract the extension from
 * @returns {'json' | 'csv' | undefined} The format type based on the file extension, or undefined if unsupported
 */
export function getFormatFromExtension(filename: string): 'json' | 'csv' | undefined {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'json':
      return 'json';
    case 'csv':
      return 'csv';
    default:
      return undefined;
  }
}
