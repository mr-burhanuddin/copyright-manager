import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import simpleGit from "simple-git";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "copyrightManager.addCopyright",
    async () => {
      const config = vscode.workspace.getConfiguration("copyrightManager");

      const developerName = config.get<string>("developerName")?.trim();
      const organization = config.get<string>("organization")?.trim() ?? "";
      const copyrightText = config.get<string>("copyrightText") ?? "";
      const copyrightTemplate = config.get<string>("copyrightTemplate") ?? "";
      const enableAudit = config.get<boolean>("enableAuditHistory") ?? true;
      const patternString =
        config.get<string>("filePattern") || "\\.(ts|tsx|jsx|js|css)$";

      if (!developerName) {
        vscode.window.showErrorMessage(
          "Please set your Developer Name in the extension settings first."
        );
        return;
      }

      // Ask user if they want to add copyright now
      const answer = await vscode.window.showQuickPick(["Yes", "No"], {
        placeHolder: "Add/Update copyright in staged files?",
      });

      if (answer !== "Yes") {
        return;
      }

      const workspaceFolder =
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return;
      }

      const git = simpleGit({ baseDir: workspaceFolder });

      let stagedFiles: string[];
      let regex: RegExp;
      try {
        regex = new RegExp(patternString);
      } catch (e) {
        vscode.window.showErrorMessage(
          "Invalid regex in 'copyrightManager.filePattern'"
        );
        return;
      }
      try {
        const status = await git.status();
        stagedFiles = status.staged.filter((file) => regex.test(file));
      } catch (e) {
        vscode.window.showErrorMessage("Error accessing git status: " + e);
        return;
      }

      if (stagedFiles.length === 0) {
        vscode.window.showInformationMessage("No staged files found.");
        return;
      }

      // Separate files that need new copyright and those that have copyright already
      const filesMissingCopyright: string[] = [];
      const filesWithCopyright: string[] = [];

      for (const relativePath of stagedFiles) {
        const fullPath = path.join(workspaceFolder, relativePath);
        if (!fs.existsSync(fullPath)) {
          vscode.window.showWarningMessage(`File not found: ${fullPath}`);
          continue;
        }
        const content = fs.readFileSync(fullPath, "utf8");
        if (content.includes(organization)) {
          filesWithCopyright.push(relativePath);
        } else {
          filesMissingCopyright.push(relativePath);
        }
      }

      // Ask for purpose only once for new copyright files if any
      let newFilePurpose = "No purpose provided";
      if (filesMissingCopyright.length > 0) {
        const purposeInput = await vscode.window.showInputBox({
          prompt: `Enter the purpose/description for new copyright (will apply to ${filesMissingCopyright.length} files)`,
          placeHolder: "High-level purpose of the files",
        });
        if (purposeInput) {
          newFilePurpose = purposeInput;
        }
      }

      // Ask for audit purpose once if audit enabled and there are files with copyright
      let auditPurpose = "No purpose provided";
      if (enableAudit && filesWithCopyright.length > 0) {
        const auditInput = await vscode.window.showInputBox({
          prompt: `Enter the audit purpose/description for files with existing copyright (will apply to ${filesWithCopyright.length} files)`,
          placeHolder: "Audit purpose",
        });
        if (auditInput) {
          auditPurpose = auditInput;
        }
      }

      // Process files missing copyright (add copyright + initial audit with newFilePurpose)
      for (const relativePath of filesMissingCopyright) {
        const fullPath = path.join(workspaceFolder, relativePath);
        try {
          await processFile(
            fullPath,
            developerName,
            organization,
            copyrightText,
            copyrightTemplate,
            enableAudit,
            newFilePurpose,
            true // isNewFile = true
          );
          await git.add(relativePath);
        } catch (error) {
          vscode.window.showErrorMessage(
            `Error processing file ${relativePath}: ${error}`
          );
        }
      }

      // Process files with copyright (add audit if enabled with auditPurpose)
      for (const relativePath of filesWithCopyright) {
        const fullPath = path.join(workspaceFolder, relativePath);
        try {
          await processFile(
            fullPath,
            developerName,
            organization,
            copyrightText,
            copyrightTemplate,
            enableAudit,
            auditPurpose,
            false // isNewFile = false
          );
          await git.add(relativePath);
        } catch (error) {
          vscode.window.showErrorMessage(
            `Error processing file ${relativePath}: ${error}`
          );
        }
      }

      vscode.window.showInformationMessage("Copyright headers updated!");
    }
  );

  context.subscriptions.push(disposable);
}

function wrapWithPrefix(
  text: string,
  maxLineLength = 80,
  prefix = "**  "
): string {
  const words = text.split(" ");
  let line = "";
  let result = "";

  for (const word of words) {
    if ((line + word).length > maxLineLength) {
      result += prefix + line.trimEnd() + "\n";
      line = "";
    }
    line += word + " ";
  }
  if (line.length > 0) {
    result += prefix + line.trimEnd();
  }
  return result;
}

async function processFile(
  filePath: string,
  developerName: string,
  organization: string,
  copyrightTextInput: string,
  template: string,
  enableAudit: boolean,
  purpose: string,
  isNewFile: boolean
): Promise<void> {
  const fileName = path.basename(filePath);
  let fileContent = fs.readFileSync(filePath, "utf8");
  const today = new Date().toISOString().split("T")[0];
  const year = new Date().getFullYear();

  const delimiterLine =
    "**  -------------|----------|----------------------------------------------------";

  const auditLine = `**  ${today}  |  ${developerName}  |  ${purpose}`;

  let updatedContent: string;

  if (isNewFile) {
    const formattedText = wrapWithPrefix(copyrightTextInput, 80);
    // Insert new block with first audit line
    const copyrightBlock = template
      .replace(/{{fileName}}/g, fileName)
      .replace(/{{developerName}}/g, developerName)
      .replace(/{{organizationName}}/g, organization)
      .replace(/{{copyrightText}}/g, formattedText)
      .replace(/{{year}}/g, year.toString())
      .replace(/{{creationDate}}/g, today)
      .replace(/{{purpose}}/g, purpose)
      .replace(
        /{{auditLog}}/g,
        `\n${delimiterLine}\n${auditLine}\n${delimiterLine}`
      );

    updatedContent = `${fileContent}\n\n${copyrightBlock}\n`;
  } else if (enableAudit) {
    // Insert new audit line at the bottom of the audit log
    const delimiterIndices = [];
    let index = fileContent.indexOf(delimiterLine);
    while (index !== -1) {
      delimiterIndices.push(index);
      index = fileContent.indexOf(delimiterLine, index + 1);
    }

    if (delimiterIndices.length >= 2) {
      // Insert after the last delimiter (i.e., at the end of audit log)
      const lastDelimiterIndex = delimiterIndices[delimiterIndices.length - 1];
      const insertPosition = lastDelimiterIndex + delimiterLine.length;
      fileContent =
        fileContent.slice(0, insertPosition) +
        `\n${auditLine}\n${delimiterLine}` +
        fileContent.slice(insertPosition);
      updatedContent = fileContent;
    } else {
      // Fallback: just append it at the end
      updatedContent = `${fileContent}\n${delimiterLine}\n${auditLine}\n${delimiterLine}`;
    }
  } else {
    updatedContent = fileContent;
  }

  fs.writeFileSync(filePath, updatedContent, "utf8");
}

// This method is called when your extension is deactivated
export function deactivate() {}
