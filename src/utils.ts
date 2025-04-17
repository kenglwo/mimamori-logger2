import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import fetch from 'node-fetch';

const MIMAMORI_CODER_API_ENDPOINT: string = process.env.MIMAMORI_CODER_API_ENDPOINT || '';

function getRootPath() {
    // Get the root path of the first workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showInformationMessage('No workspace is open. Please open a folder via File -> Open Folder');
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    return rootPath;
}

function getFilePath(dirName: string, fileName: string) {
    // Get the root path of the first workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showInformationMessage('No workspace is open. Please open a folder via File -> Open Folder');
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    // Construct the full path to tempData.json at the project root
    const filePath:string = path.join(rootPath, dirName, fileName);
    return filePath;
}

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
export function checkFileExists(tempDataFolderName: string, tempDataFileName: string) {

    const filePath:string | undefined= getFilePath(tempDataFolderName, tempDataFileName);
    if (filePath === undefined) {
        return;
    } else {
        let flag: boolean= false;
        // Check if tempData.json exists
        if (fs.existsSync(filePath)) {
            // vscode.window.showInformationMessage('File tempData.json exists.');
            flag = true;
        } else {
            // vscode.window.showInformationMessage('File tempData.json does not exist.');
        }
        return flag;
    }
}

// @ts-ignore
export function createJsonFile(tempDataFolderName: string, tempDataFileName: string, newData) {
    const rootPath: string | undefined = getRootPath();
    const filePath:string | undefined= getFilePath(tempDataFolderName, tempDataFileName);
    if (rootPath === undefined && filePath === undefined) {
        return;
    } else if (rootPath !== undefined && filePath !== undefined){
        const dataFolderPath:string = path.join(rootPath, tempDataFolderName);
        // Ensure the config folder exists
        if (!fs.existsSync(dataFolderPath)) {
            fs.mkdirSync(dataFolderPath);
        }

        fs.writeFile(filePath, JSON.stringify({"data": []}, null, 2), (err) => {
            if (err) {
                console.error('Failed to create tempData.json:', err);
            } else {
                console.log('tempData.json created successfully!');
                appendDataToLocalFile(newData, tempDataFolderName, tempDataFileName);
            }
        });
    }
}

// @ts-ignore
export function appendDataToLocalFile(newData, tempDataFolderName, tempDataFileName) {
    const filePath: string | undefined = getFilePath(tempDataFolderName, tempDataFileName);

    if ( filePath === undefined) {
        return;
    } else {
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
}

export function sendLocalDataIfExists(tempDataFolderName: string, tempDataFileName: string) {
    const filePath: string | undefined = getFilePath(tempDataFolderName, tempDataFileName);

    if ( filePath === undefined) {
        return;
    } else {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return;
            }
        
            // @ts-ignore
            const jsonData = JSON.parse(data);
            if (Array.isArray(jsonData["data"]) && jsonData["data"].length > 0) {
                // vscode.window.showInformationMessage("local data exists");
                if (jsonData !== undefined && jsonData["data"].length > 0)  {
                    let ifDataSentSuccess = false;
                    try {
                        jsonData["data"].forEach(async (d, i) => {
                            console.log(`sending record ${i}`);
                            // vscode.window.showInformationMessage('local data is sending');
                            const res = await fetchData(MIMAMORI_CODER_API_ENDPOINT, d["dataType"], d["bodyData"], d["classCode"], false, 180000); // Set the timeout to 10000 ms
                            ifDataSentSuccess = true;

                            // if last record succesfully sent, initialize the data array
                            if (i+1 === jsonData["data"].length && ifDataSentSuccess){
                                vscode.window.showInformationMessage(`Sucessfully sent ${jsonData["data"].length} local records.`);
                                fs.writeFile(filePath, JSON.stringify({"data": []}, null, 2), (err) => {
                                    if (err) {
                                        console.error('Failed to initialize  tempData.json:', err);
                                    } else {
                                        console.log('tempData.json initialized  successfully!');
                                    }
                                });
                            }
                        });
                    } catch {
                        console.log("Local data has not been sent")
                    } 
                }
            } else {
                // vscode.window.showInformationMessage("no local data");
                return;
            }
        });
    }
  }

export function getLocalData(tempDataFolderName: string, tempDataFileName: string) {
    const filePath: string | undefined = getFilePath(tempDataFolderName, tempDataFileName);

    if ( filePath === undefined) {
        return [];
    } else {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return [];
            }
        
            try {
                // @ts-ignore
                const jsonData = JSON.parse(data);
                vscode.window.showInformationMessage(jsonData);
                if (Array.isArray(jsonData["data"])) {
                    return jsonData["data"];
                } else {
                    return [];
                }
            } catch (parseErr) {
                console.error('Error parsing JSON:', parseErr);
            }
        });
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