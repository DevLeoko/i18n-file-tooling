# i18n-file-tooling

For small projects where Weblate or Crowdin are overkill.

A command-line tool for updating and merging internationalization (i18n) translation files. Take a base language file that you work on (e.g. `en.json`) and synchronize its keys with other language files (e.g. `de.json`, `fr.json`). This tool will add missing keys, remove unused keys, and preserve existing translations.

## Features

- **Sync Translation Keys**: Automatically adds missing keys to translation files.
- **Preserve Existing Translations**: Keeps existing translations intact when updating.
- **Remove Unused Keys**: Cleans up translation files by removing keys that no longer exist in the base file.
- **Include Comments**: Adds comments with the original text above each key for better context.
- **Watch Mode**: Monitors the base file for changes and updates translation files automatically.
- **Support for TS/JS Files**: Works with TypeScript (`.ts`) and JavaScript (`.js`) translation files in addition to JSON.
- **Customizable Code Style**: Allows customization of code style preferences like quote types, trailing commas, and semicolons.

## Installation

Install the package globally using npm:

```bash
npm install -g i18n-file-tooling
```

## Usage

```bash
i18n-update --path <translations_folder> --from <base_language> --to <target_languages> [options]
```

### Options

- `--path <path>`: Path to the folder containing translation files. Defaults to the current directory (`.`).
- `--from <language>`: Base language code (e.g., `en`). Defaults to `en`.
- `--to <languages>`: Comma-separated list of target language codes (e.g., `"de,fr,es"`).
- `--watch`: Watch for changes in the base file and update translations automatically.
- `--ts`: Use TypeScript (`.ts`) files instead of JSON.
- `--js`: Use JavaScript (`.js`) files instead of JSON.
- `--single-quotes`: Use single quotes in TS/JS mode.
- `--double-quotes`: Use double quotes in TS/JS mode.
- `--trailing-comma` / `--no-trailing-comma`: Include or omit trailing commas in objects.
- `--semicolon` / `--no-semicolon`: Include or omit semicolons at the end of files.

### Code Style Options (For TS/JS Mode)

The tool can auto-detect code style preferences from the base file. However, you can override these settings using the following options:

- **Quote Type**:
  - `--single-quotes`: Use single quotes (`'`) in strings.
  - `--double-quotes`: Use double quotes (`"`) in strings.
- **Trailing Comma**:
  - `--trailing-comma`: Include a trailing comma after the last property in objects.
  - `--no-trailing-comma`: Do not include a trailing comma.
- **Semicolon**:
  - `--semicolon`: Include a semicolon at the end of the file.
  - `--no-semicolon`: Do not include a semicolon at the end.

### Examples

#### Using JSON Files

##### Scenario

You have translation files in JSON format. Your base language is English (`en.json`), and you have translations for German (`de.json`) and French (`fr.json`). You want to ensure all translation files are up-to-date with the base file.

##### Base English File (`en.json`)

```json
{
  "greeting": "Hello, world!",
  "farewell": "Goodbye!",
  "menu": {
    "home": "Home",
    "profile": "Profile",
    "settings": "Settings"
  }
}
```

##### Existing German Translation (`de.json`)

```json5
{
  // Hello, world!
  greeting: "Hallo, Welt!",
  // The key "farewell" is missing
  menu: {
    // Home
    home: "Startseite",
    // Profile
    profile: "Profil",
    // The key "settings" is missing
  },
}
```

##### Running the Tool

To update the German translation file based on the English base file, run:

```bash
i18n-update --path ./translations --from en --to de
```

##### Updated German Translation (`de.json`)

```json5
{
  // Hello, world!
  greeting: "Hallo, Welt!",
  // Goodbye!
  farewell: "",
  menu: {
    // Home
    home: "Startseite",
    // Profile
    profile: "Profil",
    // Settings
    settings: "",
  },
}
```

#### Using TypeScript Files

##### Scenario

You prefer to use TypeScript files for your translations.

##### Base English File (`en.ts`)

```typescript
export default {
  // Welcome to our application!
  greeting: "Welcome!",
  // Please sign in to continue.
  signInPrompt: "Please sign in.",
  menu: {
    // Dashboard
    dashboard: "Dashboard",
    // Reports
    reports: "Reports",
    // Logout
    logout: "Logout",
  },
};
```

##### Existing French Translation (`fr.ts`)

```typescript
export default {
  // Welcome to our application!
  greeting: "Bienvenue!",
  // The key "signInPrompt" is missing
  menu: {
    // Dashboard
    dashboard: "Tableau de bord",
    // Reports
    reports: "Rapports",
    // The key "logout" is missing
  },
};
```

##### Running the Tool with Code Style Options

To update the French translation file with your code style preferences, run:

```bash
i18n-update --path ./translations --from en --to fr --ts
```

##### Updated French Translation (`fr.ts`)

```typescript
export default {
  // Welcome to our application!
  greeting: "Bienvenue!",
  // Please sign in to continue.
  signInPrompt: "",
  menu: {
    // Dashboard
    dashboard: "Tableau de bord",
    // Reports
    reports: "Rapports",
    // Logout
    logout: "",
  },
};
```

##### What Changed?

- **Added Missing Keys**: The keys `"signInPrompt"` and `"menu.logout"` were added with empty string values.
- **Preserved Existing Translations**: Existing translations were kept intact.
- **Auto-Detected Code Style**: Note that the tool auto-detected the code style from the base file (double quotes, trailing commas, and semicolon at the end).

## Watch Mode

To automatically update translations whenever the base file changes, use the `--watch` option:

```bash
i18n-update --path ./translations --from en --to "de,fr" --watch
```
