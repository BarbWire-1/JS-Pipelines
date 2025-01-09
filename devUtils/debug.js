// TODO - integrate globally
let DEVMODE = false;

// re-implement after refactoring
function devlog(value) {
	if (DEBUG) {
		// Get the current stack trace
		const stack = new Error().stack;

		// Extract the caller's line from the stack
		//const callerLine = stack.split("\n")[ 2 ];

		// Log the value and the caller line (function and line number)
		console.warn("[DEVLOG] Value:", value);
		console.warn(stack.trim());
	}
}
if(DEVMODE)
window.onerror = function (message, source, line, colno, error) {
	console.log(
		"An error occurred:",
		message,
		"at line:",
		line,
		"in file:",
		source,
		"stack: \n",
		error.stack.split('\n').splice(2).join('\n').trim()
	);
	// Prevent default handling of the error
	return true;
};


// check the props in pipelines
function getProps(obj) {
	const ownProps = Object.getOwnPropertyNames(obj);
	console.log({ ownProps });
	const prototypeProps = Object.getOwnPropertyNames(
		Object.getPrototypeOf(obj)
	);
	console.log({ prototypeProps });
	// merge own and inherited props
	return [ ...new Set([ ...ownProps, ...prototypeProps ]) ];
}


export { DEVMODE, devlog, getProps }