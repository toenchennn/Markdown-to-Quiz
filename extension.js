

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')

// =======================================================================================
// 									  CUSTOM IMPORTS 
// =======================================================================================

/**
 * Imports the 'marked' library, a markdown parser and compiler.
 * @module marked
 */
const { marked } = require('marked');

/**
 * Custom renderer object for formatting Markdown elements into HTML.
 * @property {function(string): string} strong - Renders strong (bold) text. Wraps the input string in <b> tags.
 * @property {function(string): string} em - Renders emphasized (italic) text. Wraps the input string in <i> tags.
 * @property {function(string): string} del - Renders deleted (strikethrough) text. Wraps the input string in <s> tags.
 */
const renderer = {
	strong(ln) {
		return `<b>${ln}</b>`
	},
	em(ln) {
		return `<i>${ln}</i>`
	},
	del(ln) {
		return `<s>${text}</s>`
	}

};

// Overriding marked to use classic HTML formatting wraps.
// marked.use({ renderer });

// =======================================================================================
// 										ATTRIBUTES 
// =======================================================================================

const CORRECT_QUIZ_OPTION_PREFIX = '- [x] '


// =======================================================================================
// 										FUNCTIONS 
// =======================================================================================

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
			vscode.window.showInformationMessage('Hello World from Markdown Quiz Editor!')
			testFunction()

			const editor = vscode.window.activeTextEditor;

			if(!editor) {
				vscode.window.showErrorMessage('No active text editor found.')
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
	return markdown_to_JSON_translatorV1(markdownContent)
}


function handleInconsistentQuizType(quizType, arrayOfQuizOptions) {

	if( isSingleChoiceQuiz(arrayOfQuizOptions) )
		return quizType === 'SINGLE' ? true : false

	// Since the quiz type is not SINGLE, we can assume it is MULTIPLE
	return true

}

/**
 * Translates Markdown formatting in a given line to corresponding HTML tags.
 * Applies strikethrough, underline, italic, and bold conversions in order.
 *
 * @param {string} ln - The input string containing Markdown formatting.
 * @returns {string} The string with Markdown formatting converted to HTML.
 */
function translateFormatting(ln) {
	return marked.parseInline(ln)
}

/**
 * Determines the quiz type based on a given mnemonic string.
 *
 * Accepts various case-insensitive mnemonics or abbreviations and returns the corresponding quiz type:
 * - "MULTIPLE" or "MC" for multiple choice
 * - "SINGLE" or "SC" for single choice
 * - "NUMERIC" for numeric input
 * - "FREE_TEXT" or "FREETEXT" for free text input
 *
 * @param {string} mnemonic - The mnemonic or abbreviation representing the quiz type.
 * @returns {('MULTIPLE'|'SINGLE'|'NUMERIC'|'FREE_TEXT'|null)} The quiz type string, or null if no match is found.
 */
function getQuizTypeFromMnemonic(mnemonic) {

	// Convert the mnemonic to uppercase for case-insensitive comparison
	const mnemonicUpper = mnemonic.toUpperCase()

	if( 'MULTIPLE'.startsWith(mnemonicUpper) || mnemonicUpper === 'MC' ) {

		return 'MULTIPLE'

	} else if( 'SINGLE'.startsWith(mnemonicUpper) || mnemonicUpper === 'SC' ) {

		return 'SINGLE'

	} else if( 'NUMERIC'.startsWith(mnemonicUpper) ) {

		return 'NUMERIC'

	} else if( 'FREE_TEXT'.startsWith(mnemonicUpper) || 'FREETEXT'.startsWith(mnemonicUpper) ) {

		return 'FREE_TEXT'

	} else 
		return null

}

/**
 * Determines if the provided list of options represents a single-choice quiz.
 *
 * A single-choice quiz is defined as having exactly one correct answer among the options.
 * Each option is expected to be a JSON object with a boolean `correct` property.
 *
 * @param {Array<Object>} listOfOptions - Array of option objects, each containing a `correct` boolean property.
 * @returns {boolean} Returns `true` if there is exactly one correct answer, otherwise `false`.
 */
function isSingleChoiceQuiz(listOfOptions/* List of JSON Objects */) {

	// Check if the list of options contains only one correct answer
	let correctCount = false

	for(let option of listOfOptions) {
		if(option.correct) {
			correctCount = true
			break; // prevents iterating 
		}
	}

	if(!correctCount) // If there are no correct answers, it is not a single-choice quiz
		return false
	

	// If there is exactly one correct answer, it is a single-choice quiz
	return true
}

/**
 * Extracts quiz options from the provided Markdown content and returns them as a formatted JSON string.
 *
 * @param {string[]} splitLines - The Markdown content split into lines by '\n'.
 * @returns {string} A JSON string representing an array of quiz option objects, each with "optionText" and "correct" properties.
 */
function getQuizOptionsFromMarkdown(splitLines /* Lines split after \n */) {

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
		getArrayOfQuizOptionsFromMarkdown(splitLines), // The array of quiz option objects in JSON
		null, 
		2
	)
} // end of function


/**
 * This function is used for later processing of markdown content to extract quiz options.
 * Extracts quiz options from markdown content by identifying lines that start with '### '.
 * 
 * Each matching line is processed by the handleMarkdownQuizOptions function.
 *
 * @param {string[]} splitLines - An array of strings, each representing a line from the markdown content.
 * @returns {Array} An array of parsed quiz options as returned by handleMarkdownQuizOptions.
 */
function getArrayOfQuizOptionsFromMarkdown(splitLines) {
	// Initialize an array to hold the parsed quiz options
	let options = []

	// Searches for each line representing a quiz option in the markdown content.
	for(let ln of splitLines)

		// '- [ ]' and '- [x]' are interpreted as the quiz option.
		// /^\s*-\s\[\s?[xX]?\s?\]\s*/ 
		// /^\s*-\s\[\s\]\s+(.*)/
		if ( ln.match(/^\s*-\s*\[\s*(x|X)?\s*\]/) )
			options.push( handleMarkdownQuizOptions(ln) )
		

	// Return the array of quiz options, not processed as JSON yet.
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
	const lines = markdownContent.split('\n')

	// Initialize an array to hold the parsed expressions
	const result = {}

	// Flag to track if we are currently processing a question when parsing the line with '# '
	let isQuestion = true

	// Iterate through each line to parse the markdown content
	for(let ln of lines) {

		// Removes leading and trailing whitespaces for better handling
		ln = ln.trim()

		// Converts formatting from Markdown to HTML format
		ln = translateFormatting(ln)

		// '#' is interpreted as the question text in the first parsing.
		// In the second parsing, it is interpreted as the question type.
		if( ln.startsWith('# ') ) {

			// extracts the question text by removing the '# ' prefix, trailing and leading whitespaces
			const parsedContent = ln.slice(2).trim()

			// This case distinction is important since '# ' is used for both the question text and the question type.
			if(isQuestion) {

				// Reset the flag for the next question
				isQuestion = false

				// adds the question text to the result object
				result[`question`] = "<div>\n      " /* 6 spaces */ + parsedContent + "\n    </div>" /* 4 spaces */; 

			} else {

				result[`type`] = getQuizTypeFromMnemonic(parsedContent)

			} // end of if-else

		}
	
		// '##' is interpreted as the quiz comment (optional).
		else if( ln.startsWith('## ') ) {
			
			 const commentText = ln.slice(3).trim() // gets the comment text by removing the '## ' prefix
			 result[`comment`] = commentText

		} // end of if-else

	} // end of for

	// Get the quiz options from the markdown content and store them in a JSON object.
	result[`options`] = getArrayOfQuizOptionsFromMarkdown(lines)

	result[`quizSet`] = 'GENERIC'
	result[`inputFilter`] = { }
	
	return [result]; // Return the result as an array containing a single object
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
	return handleMarkdownQuizOptionsV2(ln)

} // end of function `handleMarkdownQuizOptions`


function isCheckedTask(ln) {
	return /^\s*-\s*\[\s*[xX]\s*\]/.test(ln)
}

function removeCheckbox(ln) {
	
	// const result = ln.replace(/^\s*-\s\[\s?[xX]?\s?\]\s*/, '')
	const result = ln.replace(/^\s*-\s*\[\s*(x|X)?\s*\]/, '')
	return result
}


function handleMarkdownQuizOptionsV2(ln) {

	return {
		optionText: removeCheckbox(ln).trim(),
		correct: isCheckedTask(ln)
	}	

}


function handleMarkdownQuizOptionsV1(ln) {
	// Gets the option text by removing the '### ' prefix
	//let optionTxt = ln.slice(4).trim()
	let optionTxt = ln.trim()

	// Array of substring tokens, split at whitespaces, e.g. '[x] Option   1' -> ['[x]', 'Option', '1']
	// This variable is relevant for checking if the option is correct ('[x]') or not.
	const tokenize = optionTxt.split(/\s+/)

	// Assume that the option is incorrect by default until proven otherwise (i.e., if it starts with '[x]')
	let isCorrect = false

	// Checks if the first token is '- [x]'.
	// Assume there are no other patterns like '- [x]' in the option text.
	if (tokenize[0] === '- [x]') {

		// If the first token is '- [x]', it indicates a correct answer
		isCorrect = true
		optionTxt = optionTxt.split('- [x]')[1] // Remove '[x] ' prefix
		optionTxt = optionTxt.trim() // Trim any leading/trailing whitespace

	} 
	
	// Assume there are no other patterns like '[ ]' in the option text.
	else {

		const splitOption = optionTxt.split('- [ ]');
		
		// Ensure that the option starts with '[ ]' if it is not correct
		// Otherwise, it is a regular option, so calling at index 1 leads to an out-of-bounds error
		if( splitOption.length > 1 ) {
			optionTxt = splitOption[1] // Remove '[ ] ' prefix
		}

	}

	return {
		optionText: optionTxt, // get option text
		correct: isCorrect // default to false
	}	
}



function testFunction() {
	vscode.window.showInformationMessage('This is a test function!')
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}