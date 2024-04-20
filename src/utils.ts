import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function checkFileExists(tempDataFileName: string) {
    // Get the root path of the first workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showInformationMessage('No workspace is open.');
        return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;

    // Construct the full path to tempData.json at the project root
    const filePath = path.join(rootPath, 'config', tempDataFileName);

    let flag: boolean= false;
    // Check if tempData.json exists
    if (fs.existsSync(filePath)) {
        vscode.window.showInformationMessage('File tempData.json exists.');
        flag = true;
    } else {
        vscode.window.showInformationMessage('File tempData.json does not exist.');
    }
    return flag
}

export function createJsonFile(tempDataFileName: string) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showInformationMessage('No workspace is open.');
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const configPath = path.join(rootPath, 'config');
    const filePath = path.join(rootPath, 'config', tempDataFileName);  // Specifies the file path within the project root

    // Ensure the config folder exists
    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(configPath);
    }

    fs.writeFile(filePath, JSON.stringify({}, null, 2), (err) => {
        if (err) {
            console.error('Failed to create tempData.json:', err);
        } else {
            console.log('tempData.json created successfully!');
        }
    });
}