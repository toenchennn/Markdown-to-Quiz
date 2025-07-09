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
	const disposable = vscode.commands.registerCommand
	(
		'markdown-quiz-editor.helloWorld', 

		function () {
			vscode.window.showInformationMessage('Hello World from Markdown Quiz Editor!');
			testFunction();

			const editor = vscode.window.activeTextEditor;

			if(!editor) {
				vscode.window.showErrorMessage('No active text editor found.');
				return;
			}

			const text = editor.document.getText();
			const jsonResult = markdown_to_JSON_translator(text);

			vscode.workspace.openTextDocument
			(
				{ 
					content: JSON.stringify(jsonResult, null, 2), 
					language: 'json' 
				}
			)
			.then( doc => vscode.window.showTextDocument(doc) )

		}
	);

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
	return markdown_to_JSON_translatorV1(markdownContent);
}

function markdown_to_JSON_translatorV1(markdownContent) {
	
	// Split the markdown content into lines for processing
	// Returns each line as an element in an array
	const lines = markdownContent.split('\n');

	// Initialize an array to hold the parsed questions
	const result = [];

	// Iterate through each line to parse the markdown content
	for(let ln of lines) {

		// '#' is interpreted as the question text.
		if( ln.startsWith('# ') ) {
			const questionText = ln.slice(2).trim()
			result.push( { question: questionText } );
		}
	
		// '##' is interpreted as the quiz comment (optional).
		else if( ln.startsWith('## ') ) {
			 const comment = ln.slice(3).trim()
			 result.push( { comment } );
		}

		// '###' is interpreted as the quiz option.
		else if ( ln.startsWith('### ') ) {
			result.push( handleMarkdownQuizOptions(ln) );
		} // end of if-else

	} // end of for

	return {content: result};
} // end of function `markdown_to_JSON_translator`


/**
 * Parses a markdown quiz option line and extracts the option text and correctness.
 *
 * This auxiliary function is intended for use with `markdown_to_JSON_translator`.
 * It processes a single line representing a quiz option, which should start with
 * either '[x]' (for correct answers) or '[ ]' (for incorrect answers), and returns
 * an object containing the cleaned option text and a boolean indicating correctness.
 *
 * @param {string} ln - The line of markdown text representing a quiz option, expected to start with '### [x] ' or '### [ ] '.
 * @returns {{ optionText: string, correct: boolean }} An object with the extracted option text and a flag indicating if it is the correct answer.
 */
function handleMarkdownQuizOptions(ln) { // Auxiliary function for `markdown_to_JSON_translator` to handle quiz options

	// Gets the option text by removing the '### ' prefix
	let optionTxt = ln.slice(4).trim();

	// Array of substring tokens, split at whitespaces, e.g. '[x] Option   1' -> ['[x]', 'Option', '1']
	// This variable is relevant for checking if the option is correct ('[x]') or not.
	const tokenize = optionTxt.split(/\s+/);

	// Assume that the option is incorrect by default until proven otherwise (i.e., if it starts with '[x]')
	let isCorrect = false;

	// Checks if the first token is '[x]'.
	// Assume there are no other patterns like '[x]' in the option text.
	if (tokenize[0] === '[x]') {

		// If the first token is '[x]', it indicates a correct answer
		isCorrect = true;
		optionTxt = optionTxt.split('[x]')[1]; // Remove '[x] ' prefix
		optionTxt = optionTxt.trim(); // Trim any leading/trailing whitespace

	} 
	
	// Assume there are no other patterns like '[ ]' in the option text.
	else {

		const splitOption = optionTxt.split('[ ]');
		
		// Ensure that the option starts with '[ ]' if it is not correct
		// Otherwise, it is a regular option, so calling at index 1 leads to an out-of-bounds error
		if( splitOption.length > 1 ) {
			optionTxt = optionTxt.split('[ ]')[1]; // Remove '[ ] ' prefix
		}

	}

	return {
		optionText: optionTxt, // get option text
		correct: isCorrect // default to false
	}	

} // end of function `handleMarkdownQuizOptions`



function testFunction() {
	vscode.window.showInformationMessage('This is a test function!');
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
