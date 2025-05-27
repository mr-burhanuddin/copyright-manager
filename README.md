# Copyright Manager VSCode Extension

Manage and automatically insert/update copyright headers and audit logs in your source files with ease.

## Features

- Automatically add copyright headers to staged files (regex file pattern).
- Supports customizable copyright templates with placeholders.
- Tracks file creation date, author, organization, and description.
- Maintains audit logs (change history) in existing files.
- Prompts for purpose/description when adding or updating headers.
- Automatically stages modified files after update.

## Installation

1. Install from the VSCode Marketplace or load the extension in your development environment.
2. Configure the extension settings as described below.

## Configuration

Configure the extension via VSCode Settings (`Preferences > Settings`) under the `copyrightManager` section.

| Setting              | Type    | Default                       | Description                                                        |
| -------------------- | ------- | ----------------------------- | ------------------------------------------------------------------ |
| `developerName`      | String  | (empty)                       | Your developer name to include in copyright headers (required).    |
| `organizationName`   | String  | (empty)                       | Your company or organization name to include in copyright headers. |
| `copyrightText`      | String  | License text (MIT by default) | The copyright/license text you want included in each file.         |
| `copyrightTemplate`  | String  | Default template (see below)  | Template for copyright block with placeholders.                    |
| `enableAuditHistory` | Boolean | `true`                        | Enable audit (change history) entries for existing files.          |
| `filePattern`        | String  | `\\.(ts\|tsx\|jsx\|js\|css)$` | Regex pattern to match file extensions for processing              |

### Default Copyright Template

```plaintext
/*
**  Organization: {{organizationName}}
**
**  File Name: {{fileName}}
**
**  Description: {{purpose}}
**
**  Author: {{developerName}}
**  Creation Date: {{creationDate}}
**
**  © COPYRIGHT {{year}}
{{copyrightText}}
**
**  Audit Logs (Change History):
**{{auditLog}}
*/
```

Use placeholders in the template:

- `{{fileName}}`
- `{{purpose}}` (description provided when adding/updating)
- `{{developerName}}`
- `{{creationDate}}`
- `{{auditLog}}`
- `{{organizationName}}`
- `{{copyrightText}}`
- `{{filePattern}}` (regex pattern to match the files)

## Usage

1. Stage your code changes in Git (`git add <files>`).
2. Run the command **Add/Update Copyright** from the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. Confirm if you want to add/update copyright headers in the staged files.
4. For new files or when audit is enabled, enter a brief purpose/description when prompted.
5. The extension updates the copyright headers and audit logs in the staged files.
6. Modified files are automatically re-staged for commit.

## Notes

- Only staged files with matching {{filePattern}} are processed.
- If no developer name is configured, the extension will show an error and stop.
- Audit history logs changes with date, developer name, and purpose.
- The extension appends audit logs between delimiter lines in the file.

## Development & Contribution

Feel free to contribute or report issues via the repository.

## License

[MIT License](LICENSE)
