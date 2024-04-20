import * as path from 'path';
import * as vscode from 'vscode';
import { config } from 'dotenv';
config({ path: path.join(__dirname, '..', '.env') });
import { fetchData, checkFileExists, createJsonFile, appendDataToLocalFile } from './utils';

const MONGO_API_KEY: string = process.env.MONGO_API_KEY || '';
const MONGO_DB_NAME: string = process.env.DBNAME || '';
const MONGO_DATA_SRC: string = process.env.DATA_SRC || '';
const MONGO_API_ENDPOINT: string = process.env.MONGO_API_ENDPOINT || '';
const MIMAMORI_CODER_API_ENDPOINT: string = process.env.MIMAMORI_CODER_API_ENDPOINT || '';
const tempDataFileName: string = 'tempData.json';

export const activate = async(context: vscode.ExtensionContext) => {
  vscode.window.showInformationMessage('Mimamori-logger is activated.');
  let studentId: any = context.workspaceState.get('studentId');
  let classCode: any = context.workspaceState.get('classCode');


  if (studentId === undefined) {
    studentId = await vscode.window.showInputBox({
      placeHolder: 'Student ID',
      prompt: 'Insert your student ID',
    });
    context.workspaceState.update('studentId', studentId);
  }

  if (classCode === undefined) {
    classCode = await vscode.window.showInputBox();
    context.workspaceState.update('classCode', classCode);
  }

  if (studentId && classCode) {
    studentId = context.workspaceState.get('studentId');
    classCode = context.workspaceState.get('classCode');
    vscode.window.showInformationMessage(`studentID: [${studentId}], classCode: [${classCode}]`);
  }

  //Post data when the source code is saved
  vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
    const wsName: any = vscode.workspace.name;
    const savedDate: string = new Date().toLocaleString(); 
    const filePath = vscode.window.activeTextEditor === undefined ? '' : vscode.window.activeTextEditor.document.uri.fsPath;
    let bodyData = {};
    let dataType = '';
    let fileExtensionName = '';
    // if (filePath.indexOf(wsName) === -1) return;

    if (document.languageId === 'javascript' || document.languageId === 'html' || document.languageId === 'css') {
      //ToDo: Refactoring
      dataType = 'javascript';
      fileExtensionName = 'js';
      if (document.languageId === 'html') {
        fileExtensionName = 'html';
      } else if (document.languageId === 'css') {
        fileExtensionName = 'css';
      }
    } else if(document.languageId === 'python') {
      dataType = 'python';
	  fileExtensionName = 'py';
    }

    studentId = context.workspaceState.get('studentId');
    classCode = context.workspaceState.get('classCode');
    const fileName = path.basename(filePath);
    const curretDir = path.join(filePath, '..');
    const targetPath = path.join(curretDir, fileName);
    const targetUri = vscode.Uri.file(targetPath);
    const readData = await vscode.workspace.fs.readFile(targetUri);
    const fileContent = Buffer.from(readData).toString('utf8');
    const source = [
      {
        'fileExtension': fileExtensionName,
        'filename': fileName,
        'content': fileContent,
      }
    ];

    bodyData = {
      'document': {
        'studentId': studentId,
        'workspace': classCode,
        'savedAt': savedDate,
        'sources': source
      }
    };

    //Post data to MongoDB
    // try {
    //   const res = await fetchData(MONGO_API_ENDPOINT, dataType, bodyData, classCode, true);
    // } catch (e: any) {
    //   vscode.window.showInformationMessage(e.message);
    // }

    // Post data to Mimamori
    try {
      // const res = await fetchData(MIMAMORI_CODER_API_ENDPOINT, dataType, bodyData, classCode, false);
      // TODO: check if local data exists
      // TODO: if exists, send it by each entry
      const res = await fetchData(MIMAMORI_CODER_API_ENDPOINT, dataType, bodyData, classCode, false, 180000); // Set the timeout to 10000 ms
    } catch (e: any) {
      vscode.window.showInformationMessage(e.message);
      // TODO: write out the data into a local file
      // 1. check if a temp file exist at the project root
      const ifExist = checkFileExists(tempDataFileName);
      const newData = {dataType, bodyData, classCode};
      if (!ifExist) {
        // 2. if no, create a temp file
        createJsonFile(tempDataFileName, newData);
      } 
      else {
        // 3. write out the data into the local file
        appendDataToLocalFile(newData);
      }
    }
  });

  //Command for changing student ID
	const disposableChangeId = vscode.commands.registerCommand('mimamori-logger.changeId', async () => {
    const newId: any = await vscode.window.showInputBox({
      placeHolder: 'Student ID',
      prompt: 'Insert your student ID',
    });
    context.workspaceState.update('studentId', newId);
    studentId = context.workspaceState.get('studentId');
    classCode = context.workspaceState.get('classCode');
    vscode.window.showInformationMessage(`studentID: [${studentId}], classCode: [${classCode}]`);
	});

	const disposableChangeClassCode = vscode.commands.registerCommand('mimamori-logger.changeClassCode', async () => {
    const newClassCode: any = await vscode.window.showInputBox({
      placeHolder: 'Class Code',
      prompt: 'Insert the Class Code',
    });
    context.workspaceState.update('classCode', newClassCode);
    studentId = context.workspaceState.get('studentId');
    classCode = context.workspaceState.get('classCode');
    vscode.window.showInformationMessage(`studentID: [${studentId}], classCode: [${classCode}]`);
	});


	context.subscriptions.push(disposableChangeId);
	context.subscriptions.push(disposableChangeClassCode);
}

export function deactivate() {};