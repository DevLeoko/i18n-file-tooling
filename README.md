# i18n-file-tooling

For small projects where Weblate or Crowdin are overkill.

A command-line tool for updating and merging internationalization (i18n) JSON translation files. Take a base language file that you work on (e.g. `en.json`) and synchronize its keys with other language files (e.g. `de.json`, `fr.json`). This tool will add missing keys, remove unused keys, and preserve existing translations.

## Features

- **Sync Translation Keys**: Automatically adds missing keys to translation files.
- **Preserve Existing Translations**: Keeps existing translations intact when updating.
- **Remove Unused Keys**: Cleans up translation files by removing keys that no longer exist in the base file.
- **Include Comments**: Adds comments with the original text above each key for better context.
- **Watch Mode**: Monitors the base file for changes and updates translation files automatically.

## Installation

Install the package globally using npm:

```bash
npm install -g i18n-file-tooling
```

## Usage

```bash
i18n-update --path <translations_folder> --from <base_language> --to <target_languages> [--watch]
```

- `--path`: Path to the folder containing translation files. Defaults to the current directory (`.`).
- `--from`: Base language code (e.g., `en`). Defaults to `en`.
- `--to`: Comma-separated list of target language codes (e.g., `"de,fr,es"`).
- `--watch`: (Optional) Watch for changes in the base file and update translations automatically.

## Example

### Scenario

You have a project with translation files in JSON format. Your base language is English (`en.json`), and you have translations for German (`de.json`) and French (`fr.json`). You want to ensure all translation files are up-to-date with the base file.

#### Base English File (`en.json`)

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

#### Existing German Translation (`de.json`)

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

#### Running the Tool

To update the German translation file based on the English base file, run:

```bash
i18n-update --path ./translations --from en --to de
```

#### Updated German Translation (`de.json`)

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

#### What Changed?

- **Added Missing Keys**: The keys `"farewell"` and `"menu.settings"` were added with empty string values.
- **Preserved Existing Translations**: Existing translations for `"greeting"`, `"menu.home"`, and `"menu.profile"` were kept intact.
- **Added Comments**: Comments with the original English text were added above each key for context.

## Watch Mode

To automatically update translations whenever the base file changes, use the `--watch` option:

```bash
i18n-update --path ./translations --from en --to "de,fr" --watch
```
