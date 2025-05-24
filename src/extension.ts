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
      const copyrightTemplate = config.get<string>("copyrightTemplate") ?? "";
      const enableAudit = config.get<boolean>("enableAudit") ?? true;

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

      // Get staged files using simpleGit
      const git = simpleGit();

      let stagedFiles: string[];
      try {
        const status = await git.status();
        stagedFiles = status.staged.filter((file) =>
          /\.(ts|tsx|jsx|js|css)$/.test(file)
        );
      } catch (e) {
        vscode.window.showErrorMessage("Error accessing git status: " + e);
        return;
      }

      if (stagedFiles.length === 0) {
        vscode.window.showInformationMessage("No staged files found.");
        return;
      }

      for (const relativePath of stagedFiles) {
        const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!rootPath) {
          vscode.window.showErrorMessage("No workspace folder open.");
          return;
        }

        const fullPath = path.join(rootPath, relativePath);

        if (!fs.existsSync(fullPath)) {
          vscode.window.showWarningMessage(`File not found: ${fullPath}`);
          continue;
        }

        try {
          await processFile(
            fullPath,
            developerName,
            organization,
            copyrightTemplate,
            enableAudit
          );
          // Optionally stage the file again after modification
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

async function processFile(
  filePath: string,
  developerName: string,
  organization: string,
  template: string,
  enableAudit: boolean
): Promise<void> {
  const fileName = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath, "utf8");
  const today = new Date().toISOString().split("T")[0];
  const year = new Date().getFullYear();

  // Detect if file is new (doesn't contain your copyright marker)
  const isNewFile = !fileContent.includes(organization);

  // Ask user for purpose only if new or audit is disabled
  let purpose = "";
  if (isNewFile || !enableAudit) {
    purpose =
      (await vscode.window.showInputBox({
        prompt: `Enter the purpose/description for file ${fileName}`,
        placeHolder: "High-level purpose of the file",
      })) || "";
    if (!purpose) {
      purpose = "No purpose provided";
    }
  }

  // Prepare copyright text with placeholders replaced
  let copyrightText = template
    .replace(/{{fileName}}/g, fileName)
    .replace(/{{developerName}}/g, developerName)
    .replace(/{{organization}}/g, organization)
    .replace(/{{year}}/g, year.toString())
    .replace(/{{creationDate}}/g, today)
    .replace(/{{purpose}}/g, purpose);

  let updatedContent: string;

  if (isNewFile) {
    // Append copyright text at end for new file
    updatedContent = fileContent + "\n" + copyrightText;
  } else if (enableAudit) {
    // Insert audit/maintenance line before maintenance history table end
    const auditLine = `${today}  |  ${developerName}  |  ${purpose}\n-------------|----------|----------------------------------------------------\n`;

    const delimiterLine =
      "-------------|----------|----------------------------------------------------";

    const maintHistoryEnd = fileContent.lastIndexOf(delimiterLine);
    if (maintHistoryEnd === -1) {
      updatedContent = fileContent + "\n" + delimiterLine + "\n" + auditLine;
    } else {
      const insertPos = maintHistoryEnd + delimiterLine.length;
      updatedContent =
        fileContent.slice(0, insertPos) +
        "\n" +
        auditLine +
        fileContent.slice(insertPos);
    }
  } else {
    // Do nothing if audit disabled and file not new
    updatedContent = fileContent;
  }

  fs.writeFileSync(filePath, updatedContent, "utf8");
}

// This method is called when your extension is deactivated
export function deactivate() {}
