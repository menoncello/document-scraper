import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { DocumentScraper } from '../../core/scraper.js';
import { exportToCsv, type CsvData, type CsvRowData } from '../../exporters/csv.js';
import { exportToJson, type JsonSerializableValue } from '../../exporters/json.js';
import { loadConfig } from '../../index.js';
import type { ScrapingResult } from '../../types/index.js';
import { validateUrl } from '../utils/validation.js';

interface ScrapeOptions {
  output?: string;
  format?: 'json' | 'csv';
  config?: string;
  selector?: string;
  wait?: number;
  retries?: number;
}

interface ScrapeSummary {
  url: string;
  format: string;
  outputFile: string;
  itemsCount: number;
  duration: number;
}

/**
 * Creates a default DocumentScraper instance with the provided options.
 * @param {string} url - The URL to scrape
 * @param {ScrapeOptions} options - Scrape configuration options
 * @returns {DocumentScraper} Configured DocumentScraper instance
 */
function createDefaultScraper(url: string, options: ScrapeOptions): DocumentScraper {
  return new DocumentScraper({
    target: {
      url,
      selector: options.selector,
      waitFor: Number.parseInt(String(options.wait || '0')),
    },
    extraction: {
      fields: {},
    },
    output: {
      format: (options.format as 'json' | 'csv') || 'json',
    },
    behavior: {
      retryAttempts: Number.parseInt(String(options.retries || '3')),
      retryDelay: 1000,
      rateLimit: 1,
    },
  });
}

/**
 * Loads or creates a DocumentScraper instance based on configuration options.
 * @param {string} url - The URL to scrape
 * @param {ScrapeOptions} options - Scrape configuration options
 * @returns {Promise<DocumentScraper>} Configured DocumentScraper instance
 */
async function createScraper(url: string, options: ScrapeOptions): Promise<DocumentScraper> {
  if (options.config) {
    return DocumentScraper.fromConfigFile(options.config);
  }

  return createDefaultScraper(url, options);
}

/**
 * Converts scraped data to CSV-compatible format.
 * @param {unknown} data - The scraped data to convert
 * @returns {CsvData | CsvRowData} CSV-compatible data
 */
function convertToCsvFormat(data: unknown): CsvData | CsvRowData {
  // Handle null or undefined
  if (data === null || data === undefined) {
    return {};
  }

  // Handle arrays
  if (Array.isArray(data)) {
    // Filter out non-object values and convert them to objects
    const csvData: CsvRowData[] = data
      .filter(
        (item): item is Record<string, unknown> =>
          item !== null && item !== undefined && typeof item === 'object' && !Array.isArray(item)
      )
      .map(item => item as CsvRowData);

    // If no valid objects found, return empty array
    if (csvData.length === 0) {
      return [];
    }

    return csvData;
  }

  // Handle single object
  if (typeof data === 'object' && !Array.isArray(data)) {
    return data as CsvRowData;
  }

  // Handle primitive values - wrap in an object
  return { value: data };
}

/**
 * Exports scraped data to the specified file format.
 * @param {unknown} data - The scraped data to export
 * @param {string} format - The export format ('json' or 'csv')
 * @param {string} outputFile - The output file path
 * @returns {Promise<void>} Promise that resolves when export is complete
 */
async function exportData(data: unknown, format: string, outputFile: string): Promise<void> {
  if (format === 'json') {
    await exportToJson(data as JsonSerializableValue, outputFile);
    return;
  }

  if (format === 'csv') {
    const csvData = convertToCsvFormat(data);
    await exportToCsv(csvData, outputFile);
    return;
  }

  throw new Error(`Unsupported export format: ${format}`);
}

/**
 * Displays the scraping summary to the user.
 * @param {ScrapeSummary} summary - The scraping summary information
 */
function displaySummary(summary: ScrapeSummary): void {
  const formattedSummary = [
    chalk.blue('\n--- Scrape Summary ---'),
    `URL: ${summary.url}`,
    `Format: ${summary.format.toUpperCase()}`,
    `Output: ${summary.outputFile}`,
    `Items scraped: ${summary.itemsCount}`,
    `Duration: ${summary.duration}ms`,
  ].join('\n');

  // Write to stdout to avoid console.log ESLint error
  process.stdout.write(`${formattedSummary}\n`);
}

/**
 * Handles CLI errors and exits the process with appropriate error code.
 * @param {unknown} error - The error that occurred
 * @param {string} context - The context in which the error occurred
 * @returns {never} Never returns (exits process)
 */
function handleError(error: unknown, context: string): never {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const formattedError = chalk.red(`${context}: ${errorMessage}`);

  // Write to stderr to avoid console.error ESLint error
  process.stderr.write(`${formattedError}\n`);
  process.exit(1);
}

/**
 * Validates the provided URL and exits if invalid.
 * @param {string} url - The URL to validate
 */
function validateUrlAndExit(url: string): void {
  if (!validateUrl(url)) {
    handleError(new Error('Invalid URL provided'), 'CLI Error');
  }
}

/**
 * Loads configuration if provided.
 * @param {import('ora').Ora} spinner - The ora spinner instance
 * @param {ScrapeOptions} options - Scrape configuration options
 * @returns {Promise<void>} Promise that resolves when configuration is loaded
 */
async function loadConfiguration(
  spinner: import('ora').Ora,
  options: ScrapeOptions
): Promise<void> {
  if (options.config) {
    spinner.text = 'Loading configuration...';
    // Load config to trigger any potential config errors early
    loadConfig(options.config);
  }
}

/**
 * Performs the website scraping operation.
 * @param {import('ora').Ora} spinner - The ora spinner instance
 * @param {DocumentScraper} scraper - The configured scraper instance
 * @returns {Promise<ScrapingResult>} The scraping result
 */
async function performScraping(
  spinner: import('ora').Ora,
  scraper: DocumentScraper
): Promise<ScrapingResult> {
  spinner.text = 'Scraping website...';
  return scraper.scrape();
}

/**
 * Handles data export and displays success message.
 * @param {import('ora').Ora} spinner - The ora spinner instance
 * @param {ScrapingResult} result - The scraping result
 * @param {unknown} result.data - The scraped data
 * @param {number} result.metadata.extractionTime - The scraping duration in milliseconds
 * @param {ScrapeOptions} options - Scrape configuration options
 * @param {string} url - The URL that was scraped
 * @returns {Promise<ScrapeSummary>} The scraping summary
 */
async function handleExportAndSuccess(
  spinner: import('ora').Ora,
  result: ScrapingResult,
  options: ScrapeOptions,
  url: string
): Promise<ScrapeSummary> {
  spinner.text = 'Exporting data...';

  const format = options.format || 'json';
  const outputFile = options.output || `scraped-data.${format}`;

  await exportData(result.data, format, outputFile);

  spinner.succeed(chalk.green(`Successfully scraped and exported to ${outputFile}`));

  return {
    url,
    format,
    outputFile,
    itemsCount: Array.isArray(result.data) ? result.data.length : 1,
    duration: result.metadata.extractionTime,
  };
}

/**
 * Executes the scraping process with proper error handling and progress reporting.
 * @param {string} url - The URL to scrape
 * @param {ScrapeOptions} options - Scrape configuration options
 * @returns {Promise<void>} Promise that resolves when scraping is complete
 */
async function executeScrapingProcess(url: string, options: ScrapeOptions): Promise<void> {
  const spinner = ora('Initializing scraper...').start();

  try {
    await loadConfiguration(spinner, options);
    const scraper = await createScraper(url, options);
    const result = await performScraping(spinner, scraper);
    const summary = await handleExportAndSuccess(spinner, result, options, url);
    displaySummary(summary);
  } catch (error) {
    spinner.fail(chalk.red('Scraping failed'));
    handleError(error, 'Error');
  }
}

export const scrapeCommand = new Command('scrape')
  .description('Scrape a website and export data')
  .argument('<url>', 'URL to scrape')
  .option('-o, --output <file>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json|csv)', 'json')
  .option('-c, --config <file>', 'Configuration file path')
  .option('-s, --selector <selector>', 'CSS selector for specific elements')
  .option('-w, --wait <ms>', 'Wait time before scraping (ms)', '0')
  .option('-r, --retries <count>', 'Number of retry attempts', '3')
  .action(async (url: string, options: ScrapeOptions) => {
    try {
      validateUrlAndExit(url);
      await executeScrapingProcess(url, options);
    } catch (error) {
      handleError(error, 'CLI Error');
    }
  });
