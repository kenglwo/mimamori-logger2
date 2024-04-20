import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import fetch from 'node-fetch';

// @ts-ignore
export async function fetchData(url, dataType, bodyData, classCode, throwError, timeout = 5000) { // timeout parameter with a default of 5000 milliseconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  let bodyCopy = bodyData;
  bodyCopy['classCode'] = classCode;

  try {
      const response = await fetch(url, {
          method: 'POST', // Assuming POST, update as needed
          headers: {
              'Content-Type': 'application/json',
              'Access-Control-Request-Headers': '*'
          },
          body: JSON.stringify(bodyCopy),
          // @ts-ignore
          signal: controller.signal
      });

      clearTimeout(timeoutId); // Clear the timeout as fetch has completed

      if (!response.ok && throwError) {
          throw new Error('Network response was not ok');
      }

      return await response.json(); // Assuming the server responds with JSON
  } catch (error) {
        // @ts-ignore
      if (error.name === 'AbortError') {
          throw new Error('Fetch request timed out');
      } else {
          throw error;
      }
  }
}
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
    return flag;
}

// @ts-ignore
export function createJsonFile(tempDataFileName: string, newData) {
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

    fs.writeFile(filePath, JSON.stringify({"data": []}, null, 2), (err) => {
        if (err) {
            console.error('Failed to create tempData.json:', err);
        } else {
            console.log('tempData.json created successfully!');
            appendDataToLocalFile(newData)
        }
    });
}

// @ts-ignore
export function appendDataToLocalFile(newData) {
    // Get the root path of the workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open.');
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;

    // Define the path for the data.json file in the config folder
    const filePath = path.join(rootPath, 'config', 'tempData.json');

    // Read the existing data.json file
    try {
        // Read and parse the existing content of data.json
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);

        // Assume jsonData is an array and append new data to it
        jsonData["data"].push(newData);

        // Write the updated array back to data.json
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

        vscode.window.showInformationMessage('Data appended to data.json successfully.');
    } catch (error) {
        vscode.window.showErrorMessage('Failed to append data: ' + error);
    }
}

// const fetchData = async(endpoint: string, dataType: string, bodyData: any, classCode: any, isMongo: boolean) => {
//   let option = {};

//   let bodyCopy = bodyData;
//   if (isMongo) {
//     bodyCopy['collection'] = dataType;
//     bodyCopy['database'] = MONGO_DB_NAME;
//     bodyCopy['dataSource'] = MONGO_DATA_SRC;
//     vscode.window.showInformationMessage(classCode);
//     option = {
//       method: 'POST',
//       headers: {
//           'Content-Type': 'application/json',
//           'Access-Control-Request-Headers': '*',
//           'api-key': MONGO_API_KEY
//       },
//       body: JSON.stringify(bodyCopy),
//     };
//   } else {
//     bodyCopy['classCode'] = classCode;
//     option = {
//       method: 'POST',
//       headers: {
//           'Content-Type': 'application/json',
//           'Access-Control-Request-Headers': '*'
//       },
//       body: JSON.stringify(bodyCopy)
//     };
//   }
//   const res = await fetch(endpoint, option);
//   const resJson = await res.json();
//   return resJson;
// };