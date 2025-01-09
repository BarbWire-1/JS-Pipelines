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
		this.results;// actually never neee now... would it be of interest?
	}

	// Add method/operation to the pipeline - queue
	add(method, ...args) {
		this._checkConsumed("add");

		// TOOO - keep this or better expose sync an async methods instead of delegating internally (???)
		// Mark pipeline as async if any method returns a promise
		if (!this._isAync) {
			const result = method(this._value, ...args);
			if (result instanceof Promise) {
				this._isAsync = true;
			}
		}

		this._queue.push({ method, args });
		return this; // return this to chain
	}

	// METHODS TO EXECUTE OPERATIONS IN QUEUE - an remove executed one
	_executeSync() {
		const { method, args } = this._queue.shift();
		this._value = method(this._value, ...args);
	}

	async _executeAsync() {
		const { method, args } = this._queue.shift();
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
		this._checkConsumed("end");
		this._isConsumed = true;

		return !this._isAsync ? this._syncEnd() : this._asyncEnd();
	}

	//Loop an return an array of intermediate results - apply callback if provied
	loop(callback) {
		this._checkConsumed("loop");
		this._isConsumed = true;

		return this._isAsync
			? this._asyncLoop(callback)
			: this._syncLoop(callback);
	}

	// Step through results, access step value as next().value
	next(callback) {
		this._checkConsumed("next");
		return !this._isAsync
			? this._syncNext(callback)
			: this._asyncNext(callback);
	}

	// Internal methods to handle execution - types

	// Process the pipeline synchronously
	// END() - returning final value
	_syncEnd() {
		while (this._queue.length > 0) {
			this._executeSync();
		}
		return this._value;
	}

	async _asyncEnd() {
		while (this._queue.length > 0) {
			await this._executeAsync();
		}
		return this._value;
	}

	// LOOP()
	// intermediate results in callback (switch to result array?), returns final value when done
	_syncLoop(callback) {
		while (this._queue.length > 0) {
			this._executeSync();
			callback(this._value);
		}
		return this._value;
	}

	async _asyncLoop(callback) {
		while (this._queue.length > 0) {
			await this._executeAsync();
			callback(this._value);
		}
		return this._value;
	}

	// NEXT
	_syncNext(callback) {
		this._checkConsumed();

		const { method, args } = this._queue.shift();
		this._value = method(this._value, ...args);
		//this.results.push(this._value); // Store intermediate results

		if (callback) {
			callback(this._value); // Invoke callback with intermediate result
		}

		return this;
	}
	async _asyncNext(callback) {
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
	_checkConsumed(method) {
		if (this._isConsumed) {
			throw new Error(
				`Pipeline has already been consumed. Cannot execute '${method}'.`
			);
		}
	}

	// Helper to get the current value
	get value() {
		return this._value;
	}
}
Object.freeze(CorePipeline)
