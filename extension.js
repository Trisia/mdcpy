// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "mdcpy" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('mdcpy.paste', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Paste Processing!');

		let editor = vscode.window.activeTextEditor;
		let fileUri = editor.document.uri;
		if (!fileUri) return;
		if (fileUri.scheme === 'untitled') {
			console.warn("文件没有保存")
			return;
		}

		// 解析出当前在编辑文件的所处目录位置
		let filePath = fileUri.fsPath;
		console.log(filePath)
		let folderPath = path.dirname(filePath);
		let targetPath = path.join(folderPath, 'img')

		if (!fs.existsSync(targetPath)) {
			// 如果不存在img目录则使用
			// 正在编辑文件的同级目录作为存储图片的位置
			targetPath = folderPath;
		}


		let imgSavePath = path.join(targetPath, 'my.png')
		let content = getClipboard()
		console.log(content)
		try {
			// saveClipboardImageToFileAndGetPath(imgSavePath)
		} catch (e) {
			// 拒绝
			console.error(e)
		}



		// fs.writeFile(imgSavePath, 'this is content of my.txt file', 'utf-8', (err) => {
		// 	if (err) {
		// 		console.error("文件写入失败", err)
		// 		return false;
		// 	}
		// })
		// console.log('>> 写入成功', imgSavePath)


		// // 粘贴
		// editor.edit(it => {
		// 	let current = editor.selection;
		// 	if (current.isEmpty) {
		// 		it.insert(current.start, "AAAA")
		// 	} else {
		// 		it.replace(current, "BBBB")
		// 	}
		// })

	});

	context.subscriptions.push(disposable);
}

async function getClipboard(){
	return await vscode.env.clipboard.readText()
}


/**
 * use applescript to save image from clipboard and get file path
 * saveClipboardImageToFileAndGetPath(imagePath)
 */
function saveClipboardImageToFileAndGetPath(imagePath) {
	if (!imagePath) return;

	let platform = process.platform;
	if (platform === 'win32') {

		// Windows
		const scriptPath = path.join(__dirname, 'res', 'pc.ps1');
		console.log(imagePath, scriptPath)
		let command = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
		let powershellExisted = fs.existsSync(command)
		if (!powershellExisted) {
			command = "powershell"
		}

		const powershell = spawn(command, [
			'-noprofile',
			'-noninteractive',
			'-nologo',
			'-sta',
			'-executionpolicy', 'bypass',
			'-windowstyle', 'hidden',
			'-file', scriptPath,
			imagePath
		]);
		powershell.on('error', function (e) {
			console.error(">> Powershell error:", e);
		});
		powershell.on('exit', function (code, signal) {
			console.log('>> Powershell exit', code, signal);
		});
		powershell.stdout.on('data', function (data) {
			console.log(">> Powershell stdout:", data.toString().trim())
		});
	} else {
		console.log(">> 不支持")
	}
}


// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
