/* MIT License
* Copyright(c) 2025 Barbara Kälin
*/
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

	get value() {
		return this.corePipeline._value;
	}
}

// TODO TO TEST FOR INHERITANCE -create new testCases relying on this structure
// actually would not not need the intermediate BaseClass
// Function to create a base pipeline class and wrap it in a Proxy
function createPipelineClass(BasePipeline) {

	return class extends BasePipeline {
		constructor (value) {
			super(value);
			return new Proxy(this, pipelineHandler);
		}

	}
}

// Function to extend an existing pipeline class with additional plugins (to be added to the class itself)
function extendPipelineClass(BasePipeline, classPlugins = []) {
	class ExtendedPipeline extends BasePipeline {
		constructor (value) {
			super(value);
		}
		// Method to manually ad Plugins after instantiation
		static addPlugin(method) {

			ExtendedPipeline.prototype[ method.name ] = function (...args) {
				return this.add(method, ...args);

			};
		}
	}

	// Add class-level plugins to the class prototype (not the instance)
	classPlugins.length && classPlugins.forEach((plugin) => {
		ExtendedPipeline.prototype[ plugin.name ] = function (...args) {
			return this.add(plugin, ...args);
		};
	});


	return ExtendedPipeline;
}



const BasePipeline = createPipelineClass(Pipeline)
export { BasePipeline, createPipelineClass, extendPipelineClass }