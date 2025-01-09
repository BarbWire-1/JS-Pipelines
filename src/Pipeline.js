import { CorePipeline } from './CorePipeline.js';
import { pipelineHandler } from './pipelineHandler.js';



class Pipeline {
	constructor (value) {
		if (new.target === Pipeline) {
			throw new Error(
				"Cannot instantiate 'Pipeline' directly. Use a subclass."
			);
		}

		this.corePipeline = new CorePipeline(value);
		this._handler = new Proxy(this, pipelineHandler);
		return this._handler; // Proxy chaining
	}

	// define the exposed command-methods, delegating to private corePipeline
	add(method, ...args) {
		this.corePipeline.add(method, ...args);

		return this;
	}

	end() {
		return this.corePipeline.end();
	}

	loop(callback) {
		return this.corePipeline.loop(callback);
	}
	next(callback) {
		return this.corePipeline.next(callback);
	}

	// add custom methods dynamically to the instance prototype
	static addPlugin(method, methodName = null) {
		const name = methodName || method.name;

		if (!name) {
			throw new Error(
				"Method name is required for plugin registration."
			);
		}

		this.prototype[ name ] = function (...args) {
			return this.add(method, ...args);
		};
	}

	// expose value
	get value() {
		return this.corePipeline._value;
	}
}

// Factory function for creating custom pipeline classes with plugins
function createPipeline(plugins = [], BasePipeline = Pipeline) {
	console.log(plugins)
	return class extends BasePipeline {
		constructor (value) {
			super(value);
			if (plugins.length > 0)
				// Dynamically add plugins to the pipeline class
				plugins?.forEach((plugin) => {
					this[ plugin.name ] = (...args) => this.add(plugin, ...args);
				});
		}
	};
}
//An error occurred: Uncaught TypeError: plugins?.forEach is not a function at line: 63 in file: http://127.0.0.1:5500/Pipeline.js
export { Pipeline, createPipeline }