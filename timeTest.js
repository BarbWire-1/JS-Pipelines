// TODO test class vs passing uns as args vs manual

class Pipeline {
	constructor (value) {
		this.value = value; // Initial value
		//console.log("Pipeline started with value:", this.value);

		return new Proxy(this, {
			get: (target, prop) => {
				// Custom methods on the Pipeline class itself
				if (typeof target[ prop ] === "function") {
					return target[ prop ];
				}

				// Native method of value (e.g., array or string methods)
				if (typeof target.value[ prop ] === "function") {

					return (...args) => {
						// non-exhaustive list of mutative methods
						// TODO generalise in a check or result pbject relating to the same value obj or not? how wwithout ref
						const mutatingMethods = [
							"push",
							"pop",
							"shift",
							"unshift",
							"splice",
							"sort",
							"reverse",
							"copyWithin",
							"fill"
						];

						// overwrite target.value actively
						if (!mutatingMethods.includes(prop)) {

							target.value = target.value[ prop ](...args);
						}
						return new Pipeline(target.value); // new Pipeline with updated value to chain on
					};
				}

				// non-function properties (e.g., value)
				return target[ prop ];
			}
		});
	}

	debug() {
		console.log("Current value:", this.value);
		return this; // return the instance or chaining
	}
	end() {
		return this.value;
	}

	static addCustomMethod(name, method) {
		Pipeline.prototype[ name ] = function (...args) {
			//console.log(`Calling custom method ${name} with arguments:`, args);
			this.value = method(this.value, ...args);
			//console.log(`Result after custom method ${name}:`, this.value);
			return this; // return the instance for chaining
		};
	}
}

// Helper function to start the pipeline
function pipe(value) {
	return new Pipeline(value);
}

// adding custom methods to the pipeline
Pipeline.addCustomMethod("double", (value) => value.map((x) => x * 2));
Pipeline.addCustomMethod("increment", (value) => value.map((x) => x + 1));
Pipeline.addCustomMethod("reverse", (value) =>
	value.split("").reverse().join("")
);

// capitalize splitted text based on a regex
Pipeline.addCustomMethod("capitalizeAll", (value, regex) => {
	if (typeof value === "string") {
		return value
			.split(regex)
			.map(
				(word) =>
					word.charAt(0).toUpperCase() +
					word.slice(1).toLowerCase()
			)
			.join(" ");
	}
	return value;
});

// Array Example usage
const resultArray = pipe([ 1, 2, 3, 4 ])
	.push(5)
	.debug()
	.filter((x) => x % 2 === 0) // native
	.debug() // custom
	.map((x) => x * 10) // native
	.double() // custom
	.increment() // custom
	.end(); // to return the final value

console.log(resultArray);

// String Example usage
const resultString = pipe("hello-world this is a test")
	.reverse() // custom
	.debug() // custom
	.capitalizeAll(/[\s-]+/) // custom
	.end();

console.log(resultString);

// Object Example usage
Pipeline.addCustomMethod("renameKey", (value, oldKey, newKey) => {
	const { [ oldKey ]: valueToRename, ...rest } = value;
	return { ...rest, [ newKey ]: valueToRename };
});

const resultObject = pipe({ name: "John", age: 30 })
	.renameKey("name", "preName") // custom
	.debug()
	.end();

console.log(resultObject); // { preName: "John", age: 30 }

///////////////
// General-purpose pipeline function
function pipeline(data, ...operations) {
	return operations.reduce((result, operation) => operation(result), data);
}

// Example operations
function multiplyByTwo(numbers) {
	return numbers.map((num) => num * 2);
}

function filterEven(numbers) {
	return numbers.filter((num) => num % 2 === 0);
}

function sumAll(numbers) {
	return numbers.reduce((sum, num) => sum + num, 0);
}

// Adding operations to the Pipeline class
Pipeline.addCustomMethod("multiplyByTwo", (value) => value.map((x) => x * 2));
Pipeline.addCustomMethod("filterEven", (value) =>
	value.filter((x) => x % 2 === 0)
);
Pipeline.addCustomMethod("sumAll", (value) =>
	value.reduce((sum, num) => sum + num, 0)
);

// Test data
const numbers = Array.from({ length: 100_000_000 }, (_, i) => i + 1);

// Helper functions
function filterEven(arr) {
	return arr.filter((x) => x % 2 === 0);
}

function multiplyByTwo(arr) {
	return arr.map((x) => x * 2);
}

function sumAll(arr) {
	return arr.reduce((acc, curr) => acc + curr, 0);
}

// average time over n iterations
function measureAverageTime(label, fn, iterations = 1) {
	let totalTime = 0;
	let finalResult;
	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		finalResult = fn();
		const end = performance.now();
		totalTime += end - start;
	}
	const averageTime = totalTime / iterations;
	console.log(
		`${label}: ${averageTime.toFixed(
			2
		)} ms (average over ${iterations} runs)`
	);
	console.log(`${label} Final Result:`, finalResult); 
	return averageTime;
}

// Benchmarking the `Pipeline` class
const avgClassPipeline = measureAverageTime("Class Pipeline Execution", () =>
	pipe(numbers)
		.filterEven()
		.multiplyByTwo()
		.sumAll()
		.end()
);

// Benchmarking the standalone `pipeline` function
const avgStandalonePipeline = measureAverageTime(
	"Standalone Pipeline Execution",
	() => pipeline(numbers, filterEven, multiplyByTwo, sumAll)
);

// Benchmarking manual chaining
const avgManual = measureAverageTime("Manual Execution", () => {
	let result = numbers;
	result = filterEven(result);
	result = multiplyByTwo(result);
	return sumAll(result);
});

// Benchmarking nested calls
const avgNested = measureAverageTime("Nested Execution", () =>
	sumAll(multiplyByTwo(filterEven(numbers)))
);

// Output average times
console.log("Average Time using class-based pipeline:", avgClassPipeline, "ms");
console.log(
	"Average Time using standalone pipeline:",
	avgStandalonePipeline,
	"ms"
);
console.log("Average Time using manual chaining:", avgManual, "ms");
console.log("Average Time using nested calls:", avgNested, "ms");
/**
 * Test with array 100_000_000
 * Iterations variations
 * 15
 * Average Time using class-based pipeline: 2596.9066666642825 ms
Average Time using standalone pipeline: 2521.260000002384 ms
Average Time using manual chaining: 2568.3200000007946 ms
Average Time using nested calls: 2560.173333330949 ms

25
Average Time using class-based pipeline: 2550.7066666642827 ms
index.js:227 Average Time using standalone pipeline: 2570.0733333349226 ms
index.js:232 Average Time using manual chaining: 2475.0666666666666 ms
index.js:233 Average Time using nested calls: 2575.5799999992055 ms
fiveserver.js:1
50
Average Time using class-based pipeline: 2490.6880000007154 ms
index.js:227 Average Time using standalone pipeline: 2472.119999998808 ms
index.js:232 Average Time using manual chaining: 2507.8819999992847 ms
index.js:233 Average Time using nested calls: 2535.710000001192 ms
fiveserver.js:1

100
Average Time using class-based pipeline: 2452.899000000358 ms
index.js:227 Average Time using standalone pipeline: 2448.0489999997617 ms
index.js:232 Average Time using manual chaining: 2439 ms
index.js:233 Average Time using nested calls: 2405.2089999997615 ms

1
Average Time using class-based pipeline: 2460.800000011921 ms
index.js:227 Average Time using standalone pipeline: 2957 ms
index.js:232 Average Time using manual chaining: 2577.800000011921 ms
index.js:233 Average Time using nested calls: 2564.300000011921 ms

1
Average Time using class-based pipeline: 2794.399999976158 ms
index.js:227 Average Time using standalone pipeline: 2596.7000000476837 ms
index.js:232 Average Time using manual chaining: 2426.800000011921 ms
index.js:233 Average Time using nested calls: 2415.699999988079 ms
fiveserver.js:1

Average Time using class-based pipeline: 2990.399999976158 ms
index.js:228 Average Time using standalone pipeline: 3066 ms
index.js:233 Average Time using manual chaining: 2486.400000035763 ms
index.js:234 Average Time using nested calls: 2379.100000023842 ms
 */