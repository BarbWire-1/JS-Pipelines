/* MIT License
* Copyright(c) 2025 Barbara Kälin
*/


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

function logUncaught() {
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
}


// check the props in pipelines
function getProps(obj) {
	if (!globalThis.LOGPROPS) return;
	const ownProps = Object.getOwnPropertyNames(obj);
	console.log({ ownProps });
	const prototypeProps = Object.getOwnPropertyNames(
		Object.getPrototypeOf(obj)
	);
	console.log(obj.constructor, { prototypeProps });
	// merge own and inherited props
	return [ ...new Set([ ...ownProps, ...prototypeProps ]) ];
}
// check all chain
function dumpObject(instance) {
	// Dump instance properties and its prototype chain
	console.log("=== Instance Properties ===");
	console.log(instance);

	let current = instance;
	let depth = 0;

	while (current) {
		console.log(
			`Prototype chain depth ${depth}:`,
			Object.getOwnPropertyNames(current)
		);
		current = Object.getPrototypeOf(current);
		depth++;
	}

	// Dump class prototype chain
	const classPrototype = Object.getPrototypeOf(instance.constructor);
	console.log("\n=== Class Prototype ===");
	console.log(classPrototype);

	current = classPrototype;
	depth = 0;

	while (current) {
		console.log(
			`Class prototype chain depth ${depth}:`,
			Object.getOwnPropertyNames(current)
		);
		current = Object.getPrototypeOf(current);
		depth++;
	}
}


export { logUncaught, devlog, getProps, dumpObject}