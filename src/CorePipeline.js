/* MIT License
* Copyright(c) 2025 Barbara Kälin
*/
// TODO add in debug again to check intermediate - execute in end() only!

export class CorePipeline {
	constructor (value) {

		this._value = value;
		this._queue = [];
		this._isAsync = false;
		this._isConsumed = false;
		this._currentIndex = 0;
		this.results;// actually never used now... would it be of interest?
	}



	// Add method/operation to the pipeline - queue
	add(method, ...args) {
		this.#checkConsumed("add");

		// TODO hm maybe just expose asyncAdd when cleaning
		// Mark pipeline as async if any async method
		if (!this._isAsync) {
			this.#detectAsync(method)
		}

		this._queue.push({ method, args });
		return this; // return this to chain
	}

	// METHODS TO EXECUTE OPERATIONS IN QUEUE - an remove executed one
	#executeSync() {
		const { method, args } = this._queue.shift();
		this._value = method(this._value, ...args);
	}

	async #executeAsync() {
		const { method, args } = this._queue.shift();
		// TODO better store ync/async in queue as prop to not have to preproces anywhere!!!!
		// oul also allo ync before async being execute sync an chaining all other in PromiseAll for end an loop (??)
		let result = method(this._value, ...args);

		if (!(result instanceof Promise)) {
			result = Promise.resolve(result); // Wrap non-Promise results
		}

		this._value = await result;
	}

	// EXPOSED METHODS TO CONSUME THE PIPELINE
	// delegating to sync or async execution

	// Process the entire pipeline and return the final result
	end() {
		this.#checkConsumed("end");
		this._isConsumed = true;

		return !this._isAsync ? this.#syncEnd() : this.#asyncEnd();
	}

	//Loop an return an array of intermediate results - apply callback if provied
	loop(callback) {
		this.#checkConsumed("loop");
		this._isConsumed = true;

		return this._isAsync
			? this.#asyncLoop(callback)
			: this.#syncLoop(callback);
	}

	// Step through results, access step value as next().value
	next(callback) {
		this.#checkConsumed("next");
		return !this._isAsync
			? this.#syncNext(callback)
			: this.#asyncNext(callback);
	}

	// Internal methods to handle execution - types

	// Process the pipeline synchronously
	// END() - returning final value
	#syncEnd() {
		while (this._queue.length > 0) {
			this.#executeSync();
		}
		return this._value;
	}

	async #asyncEnd() {
		while (this._queue.length > 0) {
			await this.#executeAsync();
		}
		return this._value;
	}

	// LOOP()
	// intermediate results in callback (switch to result array?), returns final value when done
	#syncLoop(callback) {
		while (this._queue.length > 0) {
			this.#executeSync();
			callback(this._value);
		}
		return this._value;
	}

	async #asyncLoop(callback) {
		while (this._queue.length > 0) {
			await this.#executeAsync();
			callback(this._value);
		}
		return this._value;
	}

	// NEXT
	#syncNext(callback) {
		this.#checkConsumed();

		const { method, args } = this._queue.shift();
		this._value = method(this._value, ...args);
		//this.results.push(this._value); // Store intermediate results

		if (callback) {
			callback(this._value); // Invoke callback with intermediate result
		}

		return this;
	}
	async #asyncNext(callback) {
		const { method, args } = this._queue.shift();
		let result = method(this._value, ...args);

		// wrap subsequent sync functions async to chain on prev Promise
		if (!(result instanceof Promise)) {
			result = Promise.resolve(result);
		}

		this._value = await result;
		//this.results.push(this._value);

		if (callback) {
			callback(this._value);
		}

		return this;
	}

	// Ensure the pipeline hasn't already been consumed
	#checkConsumed(method) {
		if (this._isConsumed) {
			throw new Error(
				`Pipeline has already been consumed. Cannot execute '${method}'.`
			);
		}
	}
	// ugly helper to mark as async if any
	#detectAsync(method) {
		// async
		const isExplicitAsync = method.constructor.name === "AsyncFunction";

		if (isExplicitAsync) {
			this._isAsync = true;
		} else {

			const isUsingPromise = method.toString()
				.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')// remove comments
				.replace(/(['"`]).*?\1/g, '') // remove strings inside function
				.includes("Promise");

			if (isUsingPromise) this._isAsync = true;

		}
	}

	get value() {
		return this._value;
	}
}
Object.freeze(CorePipeline)
