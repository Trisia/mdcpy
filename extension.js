// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
const moment = require('moment');
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
		let folderPath = path.dirname(filePath);
		let imgStoreDir = path.join(folderPath, 'img')
		if (!fs.existsSync(imgStoreDir)) {
			// 如果不存在img目录则使用
			// 正在编辑文件的同级目录作为存储图片的位置
			imgStoreDir = folderPath;
		}

		vscode.env.clipboard.readText().then(text => {
			if (text !== '') {
				// 文本类型粘贴
				// console.log(">> Paste Text Content:", text)
				insterIntoEditor(text)
				return
			}
			// 尝试使用图片粘贴
			try {
				let savePath = path.join(imgStoreDir, `IMG${moment().format('yyyyMMDDHHmmss')}.png`);
				// 保存图片到临时位置使用临时文件名称
				saveClipboardImageToFileAndGetPath(savePath).then(p => {
					// 弹出提示框让用户输入图片名称
					return vscode.window.showInputBox({
						ignoreFocusOut: true,
						placeHolder: '请输入图片名称',
						validateInput: (value) => {
							// 校验文件名称是否已经存在
							let newName = path.join(imgStoreDir, `${value}.png`);
							if (fs.existsSync(newName)) {
								return `${value}.png 名称已经存在!`
							}
							return ""
						}
					})
				}).then(name => {
					// 重命名文件
					return new Promise((resolve, rejects) => {
						// 用户取消输入
						if (name === undefined || name === '') {
							resolve(savePath);
							return;
						}
						let newName = path.join(imgStoreDir, `${name}.png`);
						fs.rename(savePath, newName, (error) => {
							if (error) {
								rejects(">> 文件重命名失败:" + error)
								return
							}
							// 传入新的名称文件
							resolve(newName)
						});
					})
				}).then(imgPath => {
					// 从文件保存路径解析出文件名以及文件相对路径
					let relativePath = imgPath.replace(path.join(folderPath, "/"), '').replace('\\', '/')
					let fileNameIndex = relativePath.lastIndexOf('/')
					fileNameIndex = fileNameIndex == -1 ? 0 : fileNameIndex + 1
					// 构造Markdown Image Tag
					let txt = `![${relativePath.substring(fileNameIndex, relativePath.length - 4)}](${relativePath})`
					insterIntoEditor(txt)
				})
			} catch (e) { console.error(e) }
		})
	});

	context.subscriptions.push(disposable);
}

/**
 * 插入内容到
 * @param {String} text 插入内容
 */
function insterIntoEditor(text) {
	let editor = vscode.window.activeTextEditor;
	editor.edit(it => {
		let current = editor.selection;
		if (current.isEmpty) {
			it.insert(current.start, text)
		} else {
			it.replace(current, text)
		}
	}).then(success => {
		// console.log("success:", success);
		// Change the selection: start and end position of the new
		// selection is same, so it is not to select replaced text;
		var postion = editor.selection.end;
		editor.selection = new vscode.Selection(postion, postion);
	});

}

/**
 * 启动子进程调用脚本保存剪贴板里的图片到指定位置
 * 
 * @param {String} imagePath 图片存储位置
 * @returns Promise
 */
function saveClipboardImageToFileAndGetPath(imagePath) {
	return new Promise((resolve) => {
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
			// powershell.on('exit', function (code, signal) {
			// 	console.log('>> Powershell exit', code, signal);
			// });
			powershell.stdout.on('data', function (data) {
				console.log(">> Powershell stdout:", data.toString().trim())
				let imgPath = data.toString().trim()
				if (imgPath === "no image" || imgPath === '') {
					return;
				} else {
					resolve(imgPath)
				}
			});
		} else {
			console.warn(">> 平台不支持")
		}
	});

}


// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
