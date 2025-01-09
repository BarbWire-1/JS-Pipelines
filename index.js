

/* MIT License
* Copyright(c) 2025 Barbara Kälin
*/
import { createPipeline, Pipeline } from "./src/Pipeline.js";



window.DEVMODE = true;
if(DEVMODE)
window.onerror = function (message, source, line, stack, error) {
	console.log(
		"An error occurred:\n",
		message,
		"at line:",
		line,
		"in file:\n",
		source.trim(),
		'\n',
		"ERROR STACK: \n",
		error.stack.split('\n').splice(1).map(s => s.trim()).join('\n')
	);
	// Prevent default handling of the error
	return true;
};

// create an extening class on Pipeline manually ith on methods on value
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

// create an instance with value
const myMathPipeline = new MathPipeline(10);
// run with end - final value
console.log(myMathPipeline.log().end())

// manually a another method to MathPipeline
function addValue2(value, amount) {
	return value + amount;
}
MathPipeline.addPlugin(addValue2);




// create a custom Pipeline extening MathPipeline, no more plugins first
const CustomMathPipeline = createPipeline( [], MathPipeline);
// add a Plugin manually
function addValue(value, amount) {
	return value + amount;
}
CustomMathPipeline.addPlugin(addValue); // Dynamically add custom methods

// create an instance
const customPipeline = new CustomMathPipeline(10);
customPipeline.sum(10).multiply(2).addValue(2).addValue(100).end();
console.log("Final result customPipeline:", customPipeline.value);// 142

// TESTING MORE PIPELINES - manually extening
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
// { name: "John", city: "New York", isActive: true }

// TESTING ObjectPipeline with Multiple Persons (Array of Objects)
const pickedPipeline = new ObjectPipeline([
	{ name: "John", age: 28, city: "New York" },
	{ name: "Jane", age: 35, city: "London" },
	{ name: "Michael", age: 40, city: "Berlin" },
	{ name: "Jack", age: 32, city: "San Francisco" },
	{ name: "Alice", age: 29, city: "Paris" }
]);

// Apply pickBy filter: names starting with "J" and age > 30
pickedPipeline
	.pickBy((person) => person.name.startsWith("J") && person.age > 30)
	.setProperty("ThisJIsOldEnough", true) // new property to each person object in picked
	.end();

console.log("PickedPipeline result:", pickedPipeline.value);
// [
// 	{
// 		"name": "Jane",
// 		"age": 35,
// 		"city": "London",
// 		"ThisJIsOldEnough": true
// 	},
// 	{
// 		"name": "Jack",
// 		"age": 32,
// 		"city": "San Francisco",
// 		"ThisJIsOldEnough": true
// 	}
//]

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
	.replaceAll("world", "everyone")
	.toCamelCase()
	.capitalize()
	.reverse()
	.end();

console.log("StringPipeline result:", stringPipeline.value);// "enoyrevEolleH"




// Example Plugins to use on creating a class extening another Pipeline
function dec(value, n = 0) {
	return value.toFixed(n);
}





// Create a custom pipeline with additional plugins - this extends MathPipeline as 2ns arg efault
const extendedMathPipeline = createPipeline([ dec ], MathPipeline);

// instance
const pipeline = new extendedMathPipeline(10);
// run the pipe using end()
const result = pipeline
	.sum(5)
	.multiply(2)
	.subtract(3)
	.divide(.66)
	.dec(2)
	.end();

console.log("Pipeline result:", result); // 40.91


// some async stuff testing
function asyncAdd(value, amount) {
	console.log(`Adding ${amount} to ${value}`);
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log(`Aync Adding finished`);
			resolve(value + amount);
		}, 1000);
	});
}

function asyncMultiply(value, factor) {
	console.log(`Multiplying ${value} by ${factor}`);
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log(`Async Multiplication finished`);
			resolve(value * factor);
		}, 5000);
	});
}
 // TODO Instantiating a second MathPipeline (or ANY???) does NOT work - WHY?????
// seems circular on _handler - check and fix that!
 // Using the pipeline with async functions
// const asyncPipeline = new MathPipeline(1000000000);
// console.log(getProps(asyncPipeline))
//
// asyncPipeline
// 	.add(asyncAdd, 50) // asyncAdd: 1000000000 + 50
// 	.add(asyncMultiply, 2) // asyncMultiply: 1000000050 * 2
//
//
// // Use .then() to log the resolved value
// //asyncPipeline.end().then((result) => {
// //     console.log("Async result:", result); // Output: 2000000100
// //});

// // Or use await in an async function
// (async () => {
// 	const asyncResult = await asyncPipeline.end(); // SHOULD THROW!!!
// 	console.log("Async result (await):", asyncResult); // Output: 2000000100
// })();

// BasePipe - only chaining add(method) - ending with loop
const basePipe = createPipeline();

const pipelineTest = new basePipe(10);
pipelineTest
	.add((val) => val + 5) // Adding 5
	.add((val) => val * 2) // Multiplying by 2
	.loop((intermediateValue) =>
		console.log(`Intermediate Value: ${intermediateValue}`)
	); // Loop with logging
//.end(); // End processing and return the final result

const steps = new basePipe(10);

// Add operations to the pipeline
steps
	.add((val) => val + 5)
	.add((val) => val * 2)
	.add((val) => val - 3);

// Use `next` to process each operation one by one and log intermediate results
console.log("Starting next operations...");
console.log("1. result reading value:", steps.next().value); // 15
console.log("2. result reading value:",steps.next().value); // 30
console.log(
	"3. result reading value:",
	steps.next().value
); // 27

// Final result after all operations
console.log("Final result in 'steps':", steps.value);

// Create a new pipeline
const pipelineTest3 = new basePipe(10000);

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
