// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "markdown-quiz-editor" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('markdown-quiz-editor.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Markdown Quiz Editor!');
		testFunction();



	});

	context.subscriptions.push(disposable);
}


/**
 * Translates a markdown-formatted quiz into a structured JSON object.
 *
 * @param {string} markdownContent - The markdown string containing quiz questions, answers, and metadata.
 * @returns {Object[]} An array of question objects parsed from the markdown, each containing question text, possible answers, correct answer(s), and any additional metadata.
 *
 * @example
 * const markdown = `
 * ## Question 1
 * What is 2 + 2?
 * - [ ] 3
 * - [x] 4
 * `;
 * const questions = markdown_to_JSON_translator(markdown);
 * // questions = [
 * //   {
 * //     question: "What is 2 + 2?",
 * //     options: ["3", "4"],
 * //     correct: [1]
 * //   }
 * // ]
 */
function markdown_to_JSON_translator(markdownContent) {
	
	// Split the markdown content into lines for processing
	// Returns each line as an element in an array
	const lines = markdownContent.split('\n');

	// Initialize an array to hold the parsed questions
	const result = [];

	// Iterate through each line to parse the markdown content
	for(let ln of lines) {

		// '#' is interpreted as the question text.
		if( ln.startsWith('# ') ) {
			const question = ln.slice(2).trim()
			result.push( { question });
		}
	
		// '##' is interpreted as the quiz comment (optional).
		else if( ln.startsWith('## ') ) {
			 const comment = ln.slice(3).trim()
			 result.push( { comment } );
		}

		// '###' is interpreted as the quiz option.
		// TODO: Check how to handle option texts with whitespaces inbetween
		else if ( ln.startsWith('### ') ) {

			// Array of substring tokens, split at whitespaces
			const tokenize = ln.slice(4).trim().split(/\s+/);
			let isCorrect = false;

			if (tokenize[0] === '[x]') {
				// If the last token is '[x]', it indicates a correct answer
				isCorrect = true;


				const option = {
					optionText: tokenize[0], // get option text
					correct: isCorrect // default to false
				}	
			}

			else {

			}

			
		}

	}
}



function testFunction() {
	vscode.window.showInformationMessage('This is a test function!');
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
