//TODO - add native-method check for mutating and fix proxy!!!!!!!!!!!!!!!!!!!!!!!!! - DONE
//TODO - check end/endRun make one do NOT clean anything!
// TODO - check how to pass functions with arguments????
// The namespace for custom methods, avoiding global pollution

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

const CustomMethods = {
	double(value) {
		return value.map((x) => x * 2);
	},

	increment(value) {
		return value.map((x) => x + 1);
	},

	reverse(value) {
		return value.split("").reverse().join("");
	},

	async fakeNetRequest(value, delay = 1000) {
		console.log("Starting fake network request...");
		await new Promise((resolve) => setTimeout(resolve, delay));
		console.log("Fake network request complete.");
		return value.map((x) => x * 10);
	}
};

class Pipeline {
	_value;
	_isAsync;
	_currentPromise;
	_someAsync;

	constructor (value) {
		this._value = value;
		this._currentPromise = Promise.resolve();
		this._isAsync = false;
		this._someAsync = false;

		return new Proxy(this, {
			get: (target, prop) => {
				// Handle custom and native methods on _value (like array methods)
				if (typeof target._value[ prop ] === "function") {
					return (...args) => {
						return Pipeline._exec(target, (value) => {
							try {
								const result = value[ prop ](...args);
								// If the method is mutating (e.g., push), return the updated value
								if (Pipeline.isMutating(value[ prop ])) {
									return value;
								}
								return result;
							} catch (error) {
								console.error(
									`Error executing method ${prop}: ${error.message}`
								);
								console.error(error.stack);
								throw error;
							}
						});
					};
				}

				return target[ prop ]; // For non-function properties (e.g., length)
			}
		});
	}

	// Static helper to determine if the method is mutating (e.g., push, pop)
	static isMutating(method) {
		const mutatingMethods = [
			"push",
			"pop",
			"shift",
			"unshift",
			"sort",
			"reverse",
			"splice",
			"fill",
			"copyWithin"
		];
		return mutatingMethods.includes(method.name);
	}

	// Execute sync or async logic based on the pipeline's _isAsync state.
	static _exec(pipeline, fn) {
		if (this._isAsync) {
			pipeline._currentPromise = pipeline._currentPromise.then(() => {
				return fn(pipeline._value);
			});
		} else {
			pipeline._value = fn(pipeline._value); // Sync execution
		}
		return pipeline;
	}

	static _async(pipeline, asyncFn) {
		pipeline._isAsync = true;
		pipeline._someAsync = true;
		const asyncPromise = asyncFn(pipeline._value).then((result) => {
			pipeline._value = result;
			pipeline._isAsync = false;
		});
		pipeline._currentPromise = pipeline._currentPromise.then(
			() => asyncPromise
		);
		return pipeline;
	}

	// Debug method to log the current value.
	debug() {
		// Get the current stack trace
		const stack = new Error().stack;

		// Extract the caller's line from the stack
		const callerLine = stack.split("\n")[ 2 ]; // [2] because the first line is the error itself
		if (this._someAsync) {
			this._currentPromise = this._currentPromise.then(() => {
				console.log("Current value:", this._value);
				console.log(callerLine.trim());
			});
		} else {
			const error = new Error();
			console.log("Current value:", this._value);
			console.log(callerLine.trim());
		}

		return this;
	}

	// End the pipeline and return the final value.
	end() {
		if (this._someAsync) {
			return this._currentPromise.then(() => {
				this.endRun();
				console.log("Finished async pipeline:", this._value);
				return this._value;
			});
		} else {
			console.log("Finished sync pipeline:", this._value);
		}
		return this._value;
	}

	// Add custom methods dynamically with type validation.
	static addCustomMethod(name, method, expectedType) {
		if (!this.methodTypeMap) this.methodTypeMap = {};
		this.methodTypeMap[ name ] = { name, type: expectedType };

		Pipeline.prototype[ name ] = function (...args) {
			Pipeline._validateInput(this, name);

			if (method.constructor.name === "AsyncFunction") {
				return Pipeline._async(this, (value) =>
					method(value, ...args)
				);
			} else {
				return Pipeline._exec(this, (value) =>
					method(value, ...args)
				);
			}
		};
	}

	// Validate input type before method execution.
	static _validateInput(pipeline, methodName) {
		const methodMeta = Pipeline.methodTypeMap[ methodName ];
		if (!methodMeta) {
			throw new Error(
				`Method '${methodName}' is not defined on Pipeline.`
			);
		}

		const expectedType = methodMeta.type;
		const valueType = Array.isArray(pipeline._value)
			? "array"
			: typeof pipeline._value;
		//TODO check promise resolve iff i async!
		if (valueType !== expectedType) {
			const error = new Error(
				`Type error in '${methodName}': Expected ${expectedType}, got ${valueType}.`
			);
			const stackTrace = error.stack;
			console.error(error.stack);
			throw error;
		}
	}

	// Clean the custom methods from the Pipeline prototype.
	static clean() {
		//  if (!Pipeline.methodTypeMap) return;
		//for (const method of Object.keys(Pipeline.methodTypeMap)) {
		//   delete Pipeline.prototype[method];
		// }
		// Pipeline.methodTypeMap = {};
	}

	// Dynamically run a custom method on the pipeline instance.
	run(method, expectedType, ...args) {
		const methodName = "temp";

		Pipeline.addCustomMethod(methodName, method, expectedType);
		console.log(Pipeline.methodTypeMap);

		// Temporarily add the method to this instance

		Pipeline._validateInput(this, methodName);

		if (method.constructor.name === "AsyncFunction") {
			return Pipeline._async(this, (value) => method(value, ...args));
		} else {
			return Pipeline._exec(this, (value) => method(value, ...args));
		}

		const pipeline = this[ methodName ](...args);
		delete this[ methodName ]; // Clean up the temporary method
		return this;
	}

	// Finalize the pipeline (sync/async).
	endRun() {
		const cleanup = () => {
			this._value = null;
			this._currentPromise = null;
			this._isAsync = null;
			this._someAsync = null;
		};

		const finalize = (finalValue) => {
			console.log("Pipeline cleaned and finished:", finalValue);
			cleanup();
			return finalValue;
		};

		if (this._someAsync) {
			return this._currentPromise.then(() => finalize(this._value));
		}

		return finalize(this._value);
	}
}

// Factory function for creating pipelines
function pipe(value) {
	return new Pipeline(value);
}

export {CustomMethods, pipe, Pipeline}
