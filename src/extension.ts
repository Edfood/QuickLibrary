import * as vscode from 'vscode';
import * as fs from "fs"
import * as path from 'path';
import { privateEncrypt } from 'crypto';

function getFilenames(conf : vscode.WorkspaceConfiguration, folderPath : string): string[] {
	const isFile = (file : string) => {
		const stat = fs.statSync(file);
		return stat.isFile();
	}
	
	const allFilePath = fs.readdirSync(folderPath);
	let fileNames = allFilePath.filter(name => isFile(`${folderPath}/${name}`));
	
	const showsHiddenFiles = conf['showHiddenFiles'];
	if (!showsHiddenFiles) fileNames = fileNames.filter(name => name.match(/^(?!\.).*$/));
	return fileNames;
}

function pasteCode(folderPath : string, filename: string): void{
	const activeEditor = vscode.window.activeTextEditor;
	if (!activeEditor) { return; }
	const insertPosition = activeEditor.selection.active;
	const filePath = path.join(folderPath, filename);
	
	var text = "";
	try {
		text = fs.readFileSync(filePath, "utf-8");
	} catch(err) {
		vscode.window.showErrorMessage("File not found.");
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

function saveCode(filePath: string, text: string): void {
	if (fs.existsSync(filePath)) {
		vscode.window.showErrorMessage('Failed: same filename already exists.');
		return;
	}

	try {
		fs.writeFileSync(filePath, text);
	} catch(err) {
		vscode.window.showErrorMessage("Failed: saving error.");
		return;
	}

	vscode.window.showInformationMessage('Completed saving code.');
}

function openLibraryFolder(folderPath: string): void {
	const uri = vscode.Uri.file(folderPath);  // convert string to Uri
	const options = { forceNewWindow: true }; // openFolder options
	vscode.commands.executeCommand('vscode.openFolder', uri, options).then(edit => {})
	.then(undefined, err => {
		console.error(err);
	})
}

export function activate(context: vscode.ExtensionContext) {

	// Paste a library file to cursor position.
	let pasteCommand = vscode.commands.registerCommand('quicklib.paste', () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) { return; }
	
		const conf = vscode.workspace.getConfiguration('quicklib');
		const folderPath = conf['libraryFolder'];
		let fileNames = getFilenames(conf, folderPath);
		if (!fileNames) { return; };
	
		vscode.window.showQuickPick(fileNames, {placeHolder: 'Filename'}).then(filename => {
			if (filename === undefined) {  throw new Error('cancelled');	}

			pasteCode(folderPath, filename);
		});
		
	});

	// Save the selection to the Library folder.
	let saveCommand = vscode.commands.registerCommand('quicklib.save', () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) { return; }
		const selection = activeEditor.selection;
		if (activeEditor.selection.isEmpty) { return; }
		const text = activeEditor.document.getText(selection);
		const conf = vscode.workspace.getConfiguration('quicklib');
		const folderPath = conf['libraryFolder'];

		// InputBox for　entering a file name.
    vscode.window.showInputBox({placeHolder: 'Filename'}).then(filename => {
			if (filename == undefined) return;
			const filePath = path.join(folderPath, filename);
			saveCode(filePath, text);
    });
		
	});

	// Open library folder.
	let openCommand = vscode.commands.registerCommand('quicklib.open', () => {
		const conf = vscode.workspace.getConfiguration('quicklib');
		const folderPath = conf['libraryFolder'];
		openLibraryFolder(folderPath);

	});

	// register commands
	context.subscriptions.push(pasteCommand);
	context.subscriptions.push(saveCommand);
	context.subscriptions.push(openCommand)
}

export function deactivate() {}
