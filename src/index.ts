import * as fs from "fs";
import * as path from "path";
import * as JSON5 from "json5";
import { Command } from "commander";
import * as chokidar from "chokidar";

// Set up the CLI using commander
const program = new Command();

program
  .option("--path <path>", "Path to the translations folder", ".")
  .option("--from <language>", "Base language code (e.g., en)", "en")
  .option(
    "--to <languages>",
    "Comma-separated list of target language codes (e.g., de,fr,pl)",
    ""
  )
  .option("--watch", "Watch for changes and update automatically")
  .option("--ts", "Use TypeScript files instead of JSON")
  .option("--js", "Use JavaScript files instead of JSON")
  .option("--single-quotes", "Use single quotes in TS/JS mode")
  .option("--double-quotes", "Use double quotes in TS/JS mode")
  .option("--trailing-comma", "Include trailing commas in objects")
  .option("--no-trailing-comma", "Do not include trailing commas in objects")
  .option("--semicolon", "Include semicolon at the end of files")
  .option("--no-semicolon", "Do not include semicolon at the end of files")
  .parse(process.argv);

const options = program.opts();

const translationsPath = options.path;
const baseLanguage = options.from;
const targetLanguages = options.to
  .split(",")
  .filter((lang: string) => lang.length > 0);
const useTS = options.ts;
const useJS = options.js;
let useSingleQuotes = options.singleQuotes;
let useDoubleQuotes = options.doubleQuotes;
let includeTrailingComma = options.trailingComma;
let includeSemicolon = options.semicolon;
const fileExtension = useTS ? "ts" : useJS ? "js" : "json";
const exportSyntax = useTS || useJS;

const baseFilePath = path.join(
  translationsPath,
  `${baseLanguage}.${fileExtension}`
);

/**
 * Recursively updates the translations by keeping existing ones and adding missing keys.
 * @param baseObj The base translation object.
 * @param existingObj The existing translation object.
 * @returns The updated translation object.
 */
function updateTranslations(baseObj: any, existingObj: any): any {
  const updatedObj: any = {};
  for (const key in baseObj) {
    if (typeof baseObj[key] === "object" && baseObj[key] !== null) {
      // Handle nested objects recursively
      updatedObj[key] = updateTranslations(
        baseObj[key],
        existingObj ? existingObj[key] : undefined
      );
    } else {
      const existingValue = existingObj ? existingObj[key] : undefined;
      const translationValue = existingValue !== undefined ? existingValue : "";
      updatedObj[key] = translationValue;
    }
  }
  return updatedObj;
}

/**
 * Checks if a string is a valid JavaScript identifier.
 * @param key The string to check.
 * @returns True if the string is a valid identifier, false otherwise.
 */
function isValidIdentifier(key: string): boolean {
  // Regular expression for valid JavaScript identifiers
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}

/**
 * Adds comments with the original English text above each key in the translation object.
 * @param baseObj The base translation object.
 * @param updatedObj The updated translation object.
 * @param indent The indentation string for formatting.
 * @returns A formatted string representing the updated translation with comments.
 */
function addCommentsToTranslations(
  baseObj: any,
  updatedObj: any,
  indent: string = "",
  isTSJS: boolean = false,
  quoteChar: string = '"',
  includeTrailingComma: boolean = true
): string {
  let result = "";
  const indentUnit = "  "; // Two spaces
  const keys = Object.keys(baseObj);
  keys.forEach((key, index) => {
    const value = baseObj[key];
    const isLast = index === keys.length - 1;
    const trailingComma = includeTrailingComma || !isLast ? "," : "";

    // Determine whether to quote the key
    const needToQuoteKey = !isTSJS || !isValidIdentifier(key);
    const escapedKey = key
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'");
    const formattedKey = needToQuoteKey
      ? `${quoteChar}${escapedKey}${quoteChar}`
      : key;

    if (typeof value === "object" && value !== null) {
      result += `${indent}${formattedKey}: {\n`;
      result += addCommentsToTranslations(
        value,
        updatedObj[key],
        indent + indentUnit,
        isTSJS,
        quoteChar,
        includeTrailingComma
      );
      result += `${indent}}${trailingComma}\n`;
    } else {
      // Escape special characters in the English text and translation value
      const escapedEnglishText = String(value)
        .replace(/\\/g, "\\\\")
        .replace(/\r?\n/g, "\\n")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');

      let escapedTranslationValue = String(updatedObj[key])
        .replace(/\\/g, "\\\\")
        .replace(/\r?\n/g, "\\n");

      if (quoteChar === "'") {
        escapedTranslationValue = escapedTranslationValue.replace(/'/g, "\\'");
      } else {
        escapedTranslationValue = escapedTranslationValue.replace(/"/g, '\\"');
      }

      // Add the comment and key-value pair
      result += `${indent}// ${escapedEnglishText}\n`;
      result += `${indent}${formattedKey}: ${quoteChar}${escapedTranslationValue}${quoteChar}${trailingComma}\n`;
    }
  });
  return result;
}

/**
 * Detects the coding style from the base file content.
 * @param content The content of the base file.
 */
function detectStyleFromContent(content: string) {
  // Detect quote style
  const singleQuotesCount = (content.match(/'/g) || []).length;
  const doubleQuotesCount = (content.match(/"/g) || []).length;
  if (useSingleQuotes === undefined && useDoubleQuotes === undefined) {
    if (singleQuotesCount > doubleQuotesCount) {
      useSingleQuotes = true;
    } else {
      useSingleQuotes = false;
    }
  }

  // Detect trailing comma
  if (includeTrailingComma === undefined) {
    includeTrailingComma = /,\s*}/.test(content) || /,\s*\]/.test(content);
  }

  // Detect semicolon at the end
  if (includeSemicolon === undefined) {
    includeSemicolon = /;\s*$/.test(content);
  }
}

/**
 * Processes the translations by updating the target language files.
 */
function processTranslations() {
  // Read the base translation file
  if (!fs.existsSync(baseFilePath)) {
    console.error(`Base translation file not found: ${baseFilePath}`);
    return;
  }
  const baseFileContent = fs.readFileSync(baseFilePath, "utf-8");
  let baseTranslations: any = {};

  try {
    if (exportSyntax) {
      // Remove the export statement and parse the object
      const contentWithoutExport = baseFileContent
        .replace(/export\s+default\s+/, "")
        .replace(/module\.exports\s*=\s*/, "")
        .replace(/;\s*$/, ""); // Remove trailing semicolon if present

      // Detect style from the content
      detectStyleFromContent(baseFileContent);

      baseTranslations = JSON5.parse(contentWithoutExport);
    } else {
      baseTranslations = JSON5.parse(baseFileContent);
    }
  } catch (error) {
    console.error(`Error parsing base translation file: ${baseFilePath}`);
    console.error(error);
    return;
  }

  // Determine quote character
  const quoteChar = useSingleQuotes ? "'" : '"';

  targetLanguages.forEach((lang: string) => {
    const targetFilePath = path.join(
      translationsPath,
      `${lang}.${fileExtension}`
    );
    let existingTranslations: any = {};
    if (fs.existsSync(targetFilePath)) {
      const existingFileContent = fs.readFileSync(targetFilePath, "utf-8");
      try {
        if (exportSyntax) {
          const contentWithoutExport = existingFileContent
            .replace(/export\s+default\s+/, "")
            .replace(/module\.exports\s*=\s*/, "")
            .replace(/;\s*$/, "");
          existingTranslations = JSON5.parse(contentWithoutExport);
        } else {
          existingTranslations = JSON5.parse(existingFileContent);
        }
      } catch (error) {
        console.error(
          `Error parsing existing translation file: ${targetFilePath}`
        );
        console.error(error);
        return;
      }
    }

    // Update the translations
    const updatedTranslations = updateTranslations(
      baseTranslations,
      existingTranslations
    );

    // Generate the content with comments
    const translationsWithComments = `{\n${addCommentsToTranslations(
      baseTranslations,
      updatedTranslations,
      "  ",
      exportSyntax,
      quoteChar,
      includeTrailingComma
    )}}`;

    let updatedContent: string;
    if (exportSyntax) {
      // For TS/JS files, add the export statement
      updatedContent = `export default ${translationsWithComments}${
        includeSemicolon ? ";" : ""
      }\n`;
    } else {
      // For JSON files
      updatedContent = `${translationsWithComments}\n`;
    }

    // Write back to the target file
    fs.writeFileSync(targetFilePath, updatedContent, "utf-8");

    console.log(`Updated translation file: ${targetFilePath}`);
  });
}

processTranslations();

if (options.watch) {
  console.log("Watching for file changes...");
  const watcher = chokidar.watch(baseFilePath, { persistent: true });

  watcher.on("change", (filePath) => {
    console.log(`File changed: ${filePath}`);
    processTranslations();
  });
}
