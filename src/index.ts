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
  .parse(process.argv);

const options = program.opts();

const translationsPath = options.path;
const baseLanguage = options.from;
const targetLanguages = options.to
  .split(",")
  .filter((lang: string) => lang.length > 0);

const baseFilePath = path.join(translationsPath, `${baseLanguage}.json`);

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
 * Adds comments with the original English text above each key in the translation object.
 * @param baseObj The base translation object.
 * @param updatedObj The updated translation object.
 * @param indent The indentation string for formatting.
 * @returns A formatted string representing the updated translation with comments.
 */
function addCommentsToTranslations(
  baseObj: any,
  updatedObj: any,
  indent: string = ""
): string {
  let result = "";
  const indentUnit = "  "; // Two spaces
  const keys = Object.keys(baseObj);
  keys.forEach((key, index) => {
    const value = baseObj[key];
    const isLast = index === keys.length - 1;

    if (typeof value === "object" && value !== null) {
      result += `${indent}"${key}": {\n`;
      result += addCommentsToTranslations(
        value,
        updatedObj[key],
        indent + indentUnit
      );
      result += `${indent}}${isLast ? "" : ","}\n`;
    } else {
      // Escape special characters in the English text and translation value
      const escapedEnglishText = String(value)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
      const escapedTranslationValue = String(updatedObj[key])
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');

      // Add the comment and key-value pair
      result += `${indent}// ${escapedEnglishText}\n`;
      result += `${indent}"${key}": "${escapedTranslationValue}"${
        isLast ? "" : ","
      }\n`;
    }
  });
  return result;
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
  const baseTranslations = JSON.parse(baseFileContent);

  targetLanguages.forEach((lang: string) => {
    const targetFilePath = path.join(translationsPath, `${lang}.json`);
    let existingTranslations: any = {};
    if (fs.existsSync(targetFilePath)) {
      const existingFileContent = fs.readFileSync(targetFilePath, "utf-8");
      existingTranslations = JSON5.parse(existingFileContent);
    }

    // Update the translations
    const updatedTranslations = updateTranslations(
      baseTranslations,
      existingTranslations
    );

    // Generate the content with comments
    const updatedContent = `{\n${addCommentsToTranslations(
      baseTranslations,
      updatedTranslations,
      "  "
    )}}\n`;

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
