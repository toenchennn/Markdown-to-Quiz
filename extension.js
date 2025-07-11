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


function markdown_to_JSON_translatorV2(markdownContent) {

	// Split the markdown content into lines for processing
	const result = [];

	// Split the markdown content into lines for processing
	const splitLines = markdownContent.split('\n');

}


function handleInconsistentQuizType(quizType, arrayOfQuizOptions) {

	if( isSingleChoiceQuiz(arrayOfQuizOptions) ) {
		return quizType === 'SINGLE' ? true : false;
	}

	// Since the quiz type is not SINGLE, we can assume it is MULTIPLE
	return true;

}

function getQuizTypeFromMnemonic(mnemonic) {

	// Convert the mnemonic to uppercase for case-insensitive comparison
	const mnemonicUpper = mnemonic.toUpperCase();

	if( 'MULTIPLE'.startsWith(mnemonicUpper) || mnemonicUpper === 'MC' ) {

		return 'MULTIPLE';

	} else if( 'SINGLE'.startsWith(mnemonicUpper) || mnemonicUpper === 'SC' ) {

		return 'SINGLE';

	} else if( 'NUMERIC'.startsWith(mnemonicUpper) ) {

		return 'NUMERIC';

	} else if( 'FREE_TEXT'.startsWith(mnemonicUpper) || 'FREETEXT'.startsWith(mnemonicUpper) ) {

		return 'FREE_TEXT';

	} else 
		return null

}

function isSingleChoiceQuiz(listOfOptions) {

	// Check if the list of options contains only one correct answer
	let correctCount = 0;

	for(let option of listOfOptions) {
		if(option.correct) {
			correctCount++;
		}
	}

	if(correctCount === 0) {
		// If there are no correct answers, it is not a single-choice quiz
		
		return false;
	}

	// If there is exactly one correct answer, it is a single-choice quiz
	return correctCount === 1;
}

function getQuizOptionsFromMarkdown(markdownContent, splitLines) {

	// Return the options as a JSON string like:
	/*
	[
		{
			"optionText": "Option text 1",
			"correct": true
		},
		{
			"optionText": "Option text 2",
			"correct": false
		}
	]
	*/
	return JSON.stringify
	(
		getArrayOfQuizOptionsFromMarkdown(markdownContent, splitLines), 
		null, 
		2
	); 
}


/**
 * This function is used for later processing of markdown content to extract quiz options.
 * Extracts quiz options from markdown content by identifying lines that start with '### '.
 * 
 * Each matching line is processed by the handleMarkdownQuizOptions function.
 *
 * @param {string} markdownContent - The full markdown content containing quiz options.
 * @param {string[]} splitLines - An array of strings, each representing a line from the markdown content.
 * @returns {Array} An array of parsed quiz options as returned by handleMarkdownQuizOptions.
 */
function getArrayOfQuizOptionsFromMarkdown(markdownContent, splitLines) {
	// Initialize an array to hold the parsed quiz options
	let options = [];

	for(let ln of splitLines) {
		// '###' is interpreted as the quiz option.
		if ( ln.startsWith('### ') ) {
			options.push( handleMarkdownQuizOptions(ln) );
		} // end of if-else
	}

	return options;
}



/**
 * Translates markdown-formatted quiz content into a structured JSON object.
 *
 * This function parses a markdown string where:
 * - Lines starting with '# ' are treated as quiz questions.
 * - Lines starting with '## ' are treated as optional quiz comments.
 * - Lines starting with '### ' are treated as quiz options.
 *
 * The function processes each line and constructs an array of objects representing
 * questions, comments, and options, which are then returned as the `content` property
 * of the resulting JSON object.
 *
 * @param {string} markdownContent - The markdown string containing quiz content to be parsed.
 * @returns {{ content: Array<Object> }} An object with a `content` property, which is an array of parsed quiz elements.
 */
function markdown_to_JSON_translatorV1(markdownContent) {
	
	// Split the markdown content into lines for processing
	// Returns each line as an element in an array
	const lines = markdownContent.split('\n');

	// Initialize an array to hold the parsed expressions
	const result = [];

	// Checks if there are options in the markdown content (indicated by '###').
	let hasOptions = false;

	// Flag to track if we are currently processing a question when parsing the line with '# '
	let isQuestion = true; 

	// Iterate through each line to parse the markdown content
	for(let ln of lines) {

		// '#' is interpreted as the question text in the first parsing.
		// In the second parsing, it is interpreted as the question type.
		if( ln.startsWith('# ') ) {

			if(isQuestion) {

				// extracts the question text by removing the '# ' prefix, trailing and leading whitespaces
				const questionText = ln.slice(2).trim()

				// Reset the flag for the next question
				isQuestion = false; 

				result.push( { question: questionText } );

			} else {
				
				const questionText = ln.slice(2).trim()

				result.push( { comment: questionText } );

			} // end of if-else

		}
	
		// '##' is interpreted as the quiz comment (optional).
		else if( ln.startsWith('## ') ) {
			 const comment = ln.slice(3).trim()
			 result.push( { comment } );
		}

		// '###' is interpreted as the quiz option.
		else if ( ln.startsWith('### ') ) {
			
			// If there is no question yet, we need to create one. The 'options' attribute starts with a '['
			if( !hasOptions ) {
				
			}

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
