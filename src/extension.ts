import * as vscode from 'vscode';
import * as fs from "fs"
import * as path from 'path';
const conf = vscode.workspace.getConfiguration('quicklib');
const folderPath = conf['libraryFolder'];

function getFilenames() {
	const isFile = (file : string) => {
		const stat = fs.statSync(file);
		return stat.isFile();
	}
	
	const allNames = fs.readdirSync(folderPath);
	const fileNames = allNames.filter(name => isFile(`${folderPath}/${name}`))  
	return fileNames;
}

function pasteLibrary(activeEditor: vscode.TextEditor, fileName: string) {
	const insertPosition = activeEditor.selection.active;
	const filePath = path.join(folderPath, fileName);
	
	var text = "";
	try {
		text = fs.readFileSync(filePath, "utf-8");
	} catch(err) {
		vscode.window.showInformationMessage("File not found.");
		return;
	}
	
	let insertText = function(editBuilder: vscode.TextEditorEdit): void{
		editBuilder.insert(insertPosition, text);
	}

	// insertion
	let thenAfterInsert = activeEditor.edit(insertText);
	thenAfterInsert.then(
		(isSucceededEditing) => {
			if(!isSucceededEditing){
				return; // editing is failed
			}
			// after insertion is complete
		}
	)
}

export function activate(context: vscode.ExtensionContext) {

	const activeEditor = vscode.window.activeTextEditor;
	if (!activeEditor) { return; }
	const fileNames = getFilenames();
	if (!fileNames) { return; };
	let disposable = vscode.commands.registerCommand('quicklib.paste', () => {
	
		vscode.window.showQuickPick(fileNames, {placeHolder: 'Filename'}).then(value => {
			if (value === undefined) {  throw new Error('cancelled');	}

			// handle valid values
			pasteLibrary(activeEditor, value);
		});

	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
