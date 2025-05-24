```md
# 📌 Copyright Manager

A Visual Studio Code extension that helps developers automatically insert or update customizable copyright headers in staged files, with optional purpose tracking and maintenance audit logs.

---

## ✨ Features

- ✅ Automatically adds a customizable copyright header
- ✅ Inserts dynamic fields like:
  - `{{fileName}}`
  - `{{developerName}}`
  - `{{organization}}`
  - `{{year}}`
  - `{{creationDate}}`
  - `{{purpose}}`
- ✅ Optionally appends audit trail when modifying files
- ✅ Processes only **Git-staged** files (safe for version control)
- ✅ All settings are configurable through VS Code's Settings UI

---

## ⚙️ Extension Settings

You can customize the extension by going to:

> `Settings → Extensions → Copyright Manager`

### Available Settings:

| Setting Name        | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `developerName`     | Your name to appear in the copyright header             |
| `organization`      | Optional organization or company name                   |
| `copyrightTemplate` | Customizable header template with placeholders          |
| `enableAudit`       | Toggle audit log for maintenance history (`true/false`) |

---

## 💡 Usage Instructions

1. Stage your files using Git (`git add .`)
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
3. Run the command: `Add Copyright to Staged Files`
4. If the file is new or audit is enabled, you’ll be prompted for the purpose

That’s it! 🎉

---

## 🧩 Example Template (Copy & Paste)

Use this as your default value for `copyrightTemplate`:

/\*\*

- @file {{fileName}}
- @author {{developerName}}
- @organization {{organization}}
- @created {{creationDate}}
- @copyright (c) {{year}} {{organization}}. All rights reserved.
- @purpose {{purpose}}
-
- Maintenance History:
- Date | Developer | Purpose
- \------------|----------------|----------------------------------------------------
  \*/

---

## 🚀 Future Plans

- Add support for more file types and comment styles
- Option to apply to non-staged or all project files
- Per-project override for settings

---

## 📦 Requirements

- Must have Git initialized (`git init`)
- File must be staged (`git add file.ts`) before running the command

---

## 🪪 License

MIT © [Your Name or Organization]
```
