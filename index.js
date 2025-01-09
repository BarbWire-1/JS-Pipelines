//TODO - add native-method check for mutating and fix proxy!!!!!!!!!!!!!!!!!!!!!!!!! - DONE
//TODO - check end/endRun make one do NOT clean anything!

import { createPipeline, Pipeline } from "./Pipeline.js";

// TODO - check how to pass functions with arguments????

// Global DEBUG flag to control logging behavior
let DEBUG = true; // Set this flag to true or false to control logging

// Function to capture console.log outputs and include the caller line
function debug(value) {
	if (DEBUG) {
		// Get the current stack trace
		const stack = new Error().stack;

		// Extract the caller's line from the stack
		const callerLine = stack.split("\n")[ 2 ]; // [2] because the first line is the error itself

		// Log the value and the caller line (function and line number)
		console.warn("[DEBUG] Value:", value);
		console.warn(callerLine.trim());
	}
}
window.onerror = function (message, source, lineno, colno, error) {
	console.log(
		"An error occurred:",
		message,
		"at line:",
		lineno,
		"in file:",
		source
	);
	// Prevent default handling of the error
	return true;
};
class MathPipeline extends Pipeline {
	constructor (value) {
		super(value);
	}

	sum(amount = 0) {
		return this.add((value) => value + amount);
	}

	subtract(amount = 0) {
		return this.add((value) => value - amount);
	}

	multiply(factor = 1) {
		return this.add((value) => value * factor);
	}

	divide(divisor = 1) {
		return this.add((value) => value / divisor);
	}

	root(nthRoot = 2) {
		return this.add((value) => Math.pow(value, 1 / nthRoot));
	}

	exponentiate(exponent = 2) {
		return this.add((value) => Math.pow(value, exponent));
	}

	log(base = 10) {
		return this.add((value) => Math.log(value / Math.log(base)));
	}

	round(value) {
		return this.add((value) => Math.round(value));
	}

	floor(value) {
		return this.add((value) => Math.floor(value));
	}

	ceil(value) {
		return this.add((value) => Math.ceil(value));
	}
}
function addValue2(value, amount) {
	return value + amount;
}
const myMathPipeline = new MathPipeline(10);
MathPipeline.addPlugin(addValue2);
function addValue(value, amount) {
	return value + amount;
}
const CustomMathPipeline = createPipeline([],MathPipeline);
CustomMathPipeline.addPlugin(addValue); // Dynamically add custom methods

// Example usage
const customPipeline = new CustomMathPipeline(10);
customPipeline.sum(10).multiply(2).addValue(2).end();
console.log("Final result:", customPipeline.value);

// TESTING MORE PIPELINES
class ObjectPipeline extends Pipeline {
	constructor (value) {
		super(value);
	}

	// Merges an object with the current value
	merge(obj) {
		return this.add((value) => ({ ...value, ...obj }));
	}

	// Deep clones the object
	deepClone() {
		return this.add((value) => JSON.parse(JSON.stringify(value)));
	}

	// Extracts specified keys from the object
	extractKeys(keys) {
		return this.add((value) => {
			const result = {};
			keys.forEach((key) => {
				if (key in value) {
					result[ key ] = value[ key ];
				}
			});
			return result;
		});
	}

	// Picks objects (persons) based on a condition and returns an array
	pickBy(callback) {
		return this.add((value) => {
			// If value is an array of objects (persons)
			if (Array.isArray(value)) {
				return value.filter(callback); // Return the filtered array of persons
			}
			// If value is an object containing multiple objects (persons)
			else if (typeof value === "object" && value) {
				return Object.values(value).filter(callback);
			}
			return [];
		});
	}

	// Sets a property value dynamically, applies to all items if value is an array
	setProperty(key, val) {
		return this.add((value) => {
			if (Array.isArray(value)) {
				return value.map((item) => {
					item[ key ] = val;
					return item;
				});
			}
			value[ key ] = val;
			return value;
		});
	}

	// Gets a property value dynamically, applies to all items if value is an array
	getProperty(key) {
		return this.add((value) => {
			if (Array.isArray(value)) {
				return value.map((item) => item[ key ]);
			}
			return value[ key ];
		});
	}
}

// TESTING ObjectPipeline

// Single object pipeline
const objectPipeline = new ObjectPipeline({
	name: "John",
	age: 30,
	city: "New York"
});

objectPipeline
	.merge({ country: "USA" })
	.extractKeys([ "name", "city" ])
	.setProperty("isActive", true)
	.deepClone()
	.end();

console.log("ObjectPipeline result:", objectPipeline.value);
// Expected result: { name: "John", city: "New York", isActive: true }

// TESTING ObjectPipeline with Multiple Persons (Array of Objects)
const objectPipeline2 = new ObjectPipeline([
	{ name: "John", age: 28, city: "New York" },
	{ name: "Jane", age: 35, city: "London" },
	{ name: "Michael", age: 40, city: "Berlin" },
	{ name: "Jack", age: 32, city: "San Francisco" },
	{ name: "Alice", age: 29, city: "Paris" }
]);

// Apply pickBy filter: names starting with "J" and age > 30
objectPipeline2
	.pickBy((person) => person.name.startsWith("J") && person.age > 30) // Condition to filter
	.setProperty("ThisJIsOldEnough", true) // Add a new property to each person object
	.end();

console.log("Filtered ObjectPipeline result:", objectPipeline2.value);

class StringPipeline extends Pipeline {
	constructor (value) {
		super(value);
	}

	// Reverses the string
	reverse() {
		return this.add((value) => value.split("").reverse().join(""));
	}


	toCamelCase() {
		return this.add((value) => {
			return value
				.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) =>
					index === 0 ? match.toLowerCase() : match.toUpperCase()
				)
				.replace(/\s+/g, "");
		});
	}

	// Replaces all occurrences of a substring with another string
	replaceAll(search, replacement) {
		return this.add((value) => value.split(search).join(replacement));
	}

	// Capitalizes the first letter of each word in a string
	capitalize() {
		return this.add((value) =>
			value.replace(/\b\w/g, (char) => char.toUpperCase())
		);
	}


	toSnakeCase() {
		return this.add((value) => {
			return value
				.replace(/([a-z])([A-Z])/g, "$1_$2")
				.replace(/\s+/g, "_")
				.toLowerCase();
		});
	}
}

// TESTING StringPipeline
const stringPipeline = new StringPipeline(" hello world ");
stringPipeline
	.replaceAll("world", "everyone") // Replace "world" with "everyone"
	.toCamelCase() // Convert to camelCase
	.capitalize() // Capitalize the first letter of each word
	.reverse() // Reverse the string
	.end(); // Execute and get the result

console.log("StringPipeline result:", stringPipeline.value);
// Expected result: "EnoyreveHellow"



// Example Plugins
function sum(value, amount = 0) {
	return value + amount;
}

function multiply(value, factor = 1) {
	return value * factor;
}

function subtract(value, amount = 0) {
	return value - amount;
}



// Create a custom pipeline with plugins
const extendedMathPipeline = createPipeline([ sum, multiply, subtract ]);

// Using the custom pipeline
const pipeline = new extendedMathPipeline(10);

// Example usage
const result = pipeline
	.sum(5) // 10 + 5
	.multiply(2) // 15 * 2
	.subtract(3) // 30 - 3
	.end(); // Executes the pipeline

console.log("Pipeline result:", result); // Output: 27

// Create a CustomMathPipeline with the desired plugins
const CustomMathPipeline2 = createPipeline([ sum, multiply, subtract ]);

// TESTING CustomMathPipeline

const customMathPipeline2 = new CustomMathPipeline2(10);

const result2 = customMathPipeline2
	.sum(10) // 10 + 10 = 20
	.multiply(2) // 20 * 2 = 40
	.subtract(5) // 40 - 5 = 35
	.add((n) => n * 10) // 350
	.end();

console.log("Final result:", result2); // Expected: 350

// Async operations
function asyncAdd(value, amount) {
	console.log(`Adding ${amount} to ${value}`); // Debug log
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log(`Aync Adding finished`);
			resolve(value + amount);
		}, 1000);
	});
}

function asyncMultiply(value, factor) {
	console.log(`Multiplying ${value} by ${factor}`); // Debug log
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log(`Async Multiplication finished`); // Debug log
			resolve(value * factor);
		}, 5000);
	});
}

// Using the pipeline with async functions
const asyncPipeline = new CustomMathPipeline2(1000000000);

asyncPipeline
	.add(asyncAdd, 50) // asyncAdd: 1000000000 + 50
	.add(asyncMultiply, 2); // asyncMultiply: 1000000050 * 2

// Use .then() to log the resolved value
//asyncPipeline.end().then((result) => {
//     console.log("Async result:", result); // Output: 2000000100
//});

// Or use await in an async function
(async () => {
     const asyncResult = await asyncPipeline.end(); // SHOULD THROW!!!
   console.log("Async result (await):", asyncResult); // Output: 2000000100
})();

// Example Usage:
const simplePipe = createPipeline();

const pipelineTest = new simplePipe(10);
pipelineTest
	.add((val) => val + 5) // Adding 5
	.add((val) => val * 2) // Multiplying by 2
	.loop((intermediateValue) =>
		console.log(`Intermediate Value: ${intermediateValue}`)
	); // Loop with logging
//.end(); // End processing and return the final result

const pipelineTestAsync = new simplePipe(10);

// Add operations to the pipeline
pipelineTestAsync
	.add((val) => val + 5)
	.add((val) => val * 2)
	.add((val) => val - 3);

// Use `next` to process each operation one by one and log intermediate results
console.log("Starting next operations...");
console.log("Next result reading value:", pipelineTestAsync.next().value); // 15
console.log("Next result reading value:", pipelineTestAsync.next().value); // 30
console.log(
	"Next result result reading value:",
	pipelineTestAsync.next().value
); // 27

// Final result after all operations
console.log("Final result:", pipelineTestAsync.value);

// Create a new pipeline
const pipelineTest3 = new simplePipe(10000);

// Add asynchronous operations to the pipeline
pipelineTest3

	.add(async (val) => {
		await new Promise((resolve) => setTimeout(resolve, 5000));
		return val + 5;
	})
	.add(async (val) => {
		await new Promise((resolve) => setTimeout(resolve, 500));
		return val * 2;
	})
	.add(async (val) => {
		await new Promise((resolve) => setTimeout(resolve, 2500));
		return val - 3;
	});

// Define a callback function
function logIntermediateResult(intermediateValue) {
	console.log(
		`Intermediate result * 3 in callback : ${intermediateValue * 3}`
	);
}

// Use `next` to process each operation one by one and log intermediate results
async function processNextOperations() {
	console.log("Starting next async operations...");

	await pipelineTest3.next(logIntermediateResult); // logs 30015
	await pipelineTest3.next(logIntermediateResult); // logs 60030
	await pipelineTest3.next(logIntermediateResult); // logs 60021

	// Final result after all async operations
	console.log("Final result pipelineTest3:", pipelineTest3.value); // 20007 !! - not modified in callback
}

// Execute the async operations
processNextOperations();


// const CustomMethods = {
// 	double(value) {
// 		return value.map((x) => x * 2);
// 	},
//
// 	increment(value) {
// 		return value.map((x) => x + 1);
// 	},
//
// 	reverse(value) {
// 		return value.split("").reverse().join("");
// 	},
//
// 	async fakeNetRequest(value, delay = 1000) {
// 		console.log("Starting fake network request...");
// 		await new Promise((resolve) => setTimeout(resolve, delay));
// 		console.log("Fake network request complete.");
// 		return value.map((x) => x * 10);
// 	}
// };
//
// class Pipeline {
// 	_value;
// 	_isAsync;
// 	_currentPromise;
// 	_someAsync;
// 	#currentType;
//
// 	constructor (value) {
// 		this._value = value;
// 		this._currentPromise = Promise.resolve();
// 		this._isAsync = false;
// 		this._someAsync = false;
// 		this.#currentType = Array.isArray(value) ? 'array' : typeof value
//
// 		return new Proxy(this, {
// 			get: (target, prop) => {
//
// 				// Handle custom and native methods on _value (like array methods)
// 				if (typeof target._value[ prop ] === "function") {
// 					console.log(target._value[ prop ])
// 					return (...args) => {
// 						return Pipeline._exec(target, (value) => {
// 							try {
// 								const result = target._value = value[ prop ](...args);
// 								target.#currentType = Array.isArray(result) ? 'array' : typeof result;
// 								console.log("TYPE:", result, this.#currentType)
// 								// If the method is mutating (e.g., push), return the updated value
// 								if (Pipeline.isMutating(value[ prop ])) {
// 									target.#currentType = Array.isArray(value) ? 'array' : typeof value
// 									console.log("TYPE:", this.#currentType)
// 									target._value = value;
// 									return value;
// 								}
// 								return result;
// 							} catch (error) {
// 								console.error(
// 									`Error executing method ${prop}: ${error.message}`
// 								);
// 								console.error(error.stack);
// 								throw error;
// 							}
// 						});
// 					};
// 				}
//
// 				if (prop === '_value')
// 					target.#currentType = Array.isArray(target._value) ? 'array' : typeof target._value
// 				console.log("TYPE:", this.#currentType)
//
// 				return target[ prop ]; // For non-function properties (e.g., length)
// 			}
// 		});
// 	}
//
// 	// Static helper to determine if the method is mutating (e.g., push, pop)
// 	static isMutating(method) {
// 		const mutatingMethods = [
// 			"push",
// 			"pop",
// 			"shift",
// 			"unshift",
// 			"sort",
// 			"reverse",
// 			"splice",
// 			"fill",
// 			"copyWithin",
//
//
//
// 		];
// 		return mutatingMethods.includes(method.name);
// 	}
//
// 	// Execute sync or async logic based on the pipeline's _isAsync state.
// 	// Updated _exec to handle both sync and async properly
// 	static _exec(pipeline, fn) {
// 		if (pipeline._someAsync) {
// 			// Chain async operations
// 			pipeline._currentPromise = pipeline._currentPromise.then(() => {
// 				return fn(pipeline._value);
// 			}).then((result) => {
// 				if (result) pipeline._value = result; // Update value after async result
// 			});
// 		} else {
// 			// Directly execute for synchronous operations
// 			const result = fn(pipeline._value);
// 			if (result) pipeline._value = result;
// 		}
// 		return pipeline;
// 	}
//
// 	// Updated debug method to handle async properly
// 	debug() {
// 		if (this._isAsync) {
// 			this._currentPromise = this._currentPromise.then(() => {
// 				console.log("Current value (async):", this._value);
// 			});
// 		} else {
// 			console.log("Current value (sync):", this._value);
// 		}
// 		return this;
// 	}
// 	static executeSync(method, ...args) {
// 		return Pipeline._exec(this, (value) => method(value, ...args));
// 	}
//
// 	// Updated run method for dynamic method handling
// 	run(method, expectedType, ...args) {
// 		const methodName = "temp";
// 		Pipeline.addCustomMethod(methodName, method, expectedType);
//
// 		Pipeline._validateInput(this, methodName);
// 		let fn =  (value) => method(value, ...args)
// 		// TODO do not execute irectly but on end only !
// 		// Choose between async or sync execution
// 		const result = method.constructor.name === "AsyncFunction"
// 			? Pipeline._async(this, fn)
// 			: Pipeline._exec(this, fn);
//
// 		return result
// 	}
//
//
// 	static _async(pipeline, asyncFn) {
// 		pipeline._isAsync = true;
// 		pipeline._someAsync = true;
// 		const asyncPromise = asyncFn(pipeline._value).then((result) => {
// 			pipeline._value = result;
// 			pipeline._isAsync = false;
// 		});
// 		pipeline._currentPromise = pipeline._currentPromise.then(
// 			() => asyncPromise
// 		);
// 		return pipeline;
// 	}
//
//
//
// 	// End the pipeline and return the final value.
// 	end() {
// 		if (this._someAsync) {
// 			return this._currentPromise.then(() => {
// 				this.endRun();
// 				console.log("Finished async pipeline:", this._value);
// 				return this._value;
// 			});
// 		} else {
// 			console.log("Finished sync pipeline:", this._value);
// 		}
// 		return this._value;
// 	}
//
// 	// Add custom methods dynamically with type validation.
// 	static addCustomMethod(name, method, expectedType) {
// 		if (!this.methodTypeMap) this.methodTypeMap = {};
// 		this.methodTypeMap[ name ] = { name, type: expectedType };
//
// 		Pipeline.prototype[ name ] = function (...args) {
// 			Pipeline._validateInput(this, name);
//
// 			if (method.constructor.name === "AsyncFunction") {
// 				return Pipeline._async(this, (value) =>
// 					method(value, ...args)
// 				);
// 			} else {
// 				return Pipeline._exec(this, (value) =>
// 					method(value, ...args)
// 				);
// 			}
// 		};
// 	}
//
// 	// Validate input type before method execution.
// 	static _validateInput(pipeline, methodName) {
// 		const methodMeta = Pipeline.methodTypeMap[ methodName ];
// 		if (!methodMeta) {
// 			throw new Error(
// 				`Method '${methodName}' is not defined on Pipeline.`
// 			);
// 		}
//
// 	}
//
//
//
//
//
//
//
//
// 	// Finalize the pipeline (sync/async).
// 	endRun() {
// 		const cleanup = () => {
// 			this._value = null;
// 			this._currentPromise = null;
// 			this._isAsync = null;
// 			this._someAsync = null;
// 		};
//
// 		const finalize = (finalValue) => {
// 			console.log("Pipeline cleaned and finished:", finalValue);
// 			cleanup();
// 			return finalValue;
// 		};
//
// 		if (this._someAsync) {
// 			return this._currentPromise.then(() => finalize(this._value));
// 		}
//
// 		return finalize(this._value);
// 	}
// }
//
// // Factory function for creating pipelines
// function pipe(value) {
// 	return new Pipeline(value);
// }
//
// // Dynamically add custom methods from the CustomMethods namespace
// Pipeline.addCustomMethod("double", CustomMethods.double, "array");
// Pipeline.addCustomMethod("increment", CustomMethods.increment, "array");
// Pipeline.addCustomMethod("reverse", CustomMethods.reverse, "string");
// Pipeline.addCustomMethod(
// 	"fakeNetRequest",
// 	CustomMethods.fakeNetRequest,
// 	"array"
// );
//
// async function simulateAsync(value, delay) {
// 	console.log("Simulating async task...");
// 	await new Promise((resolve) => setTimeout(resolve, delay));
// 	console.log("Simulated async task completed");
// 	return value.map((x) => x + 10); // Add 10 after async delay
// }
//
// /// add a plugin on Prototype
// Pipeline.addCustomMethod(
// 	"average",
// 	(value) => value.reduce((a, b) => a + b, 0) / value.length,
// 	"array"
// );
//
// //const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
//
// (async () => {
// 	const asyncResultA = await new Pipeline([ 100, 200, 300 ], "Async ResultA")
// 		.debug() // [100, 200, 300]
// 		.push(400)
// 		.debug() // [100, 200, 300, 400]
// 		.run(simulateAsync, 10000) // Async operation n => n + 10
// 		.debug() // [110, 210, 310, 410]
// 		.average() // Synchronous operation: computes the average
// 		.debug() // 260
// 		.run((x) => x / 2.2) // Divides average by 2.2
// 		.debug() // Logs: 95.45
// 		.end(); // Returns 95.45
//
// 	console.log("Final Result:", asyncResultA);
// })();
//
//
// const asyncResultC = new Pipeline([ 1000, 2000, 3000 ], "Async ResultC")
// 	.debug() // [1000, 2000, 3000]
// 	.run(simulateAsync, 1000) //  custom async method
// 	.debug()// [1010, 2010, 3010]
// 	//.map(n => n -100)// works directly a init type is array
// 	.average()// plugin-method - coercing to num
// 	.debug() // 2010
// 	.run((x) => x / 2.2)
// 	.debug() // 913.6363636363635
// 	.toString() // coercing to string
// 	.debug()//'913.6363636363635'
// 	.run(num => parseInt(num)) // back to num int - TOO check hy type change is not logged (???)
// 	.end(); // Returns 913
//
// console.log("Final Result in C:", await asyncResultC);// 913
//
// //WHY can't I use map on the array??????
// const string = new Pipeline('Hello World', "String")
// 	.debug() // 'Hello World'
// 	.split(' ') //  native code on init type (!!!!!1234)
// 	.debug()// ['Hello', 'World']
// 	.run(arr => arr.map(w => w.toUpperCase())) // needs to be wrapped into run - why??? as coerced to array??
// 	.run(arr => arr.join(' '))
// 	.debug()// HELLO WORLD
// 	.reverse()
//
// 	.end();
//
// console.log("Final Result in string:", string);// DLROW OLLEH
// */