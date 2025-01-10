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
		//this._handler = new Proxy(this, pipelineHandler);
		//return this._handler; // Proxy chaining
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

	// TODO what is wrong in here?? Not correctly registering manually added plugins on clas
	// add custom methods dynamically to the instance prototype


	// expose value
	get value() {
		return this.corePipeline._value;
	}
}
// This messes up inheritance when creating multiple instances of one extene + expanded class
// // TODO - check where that happens!!!!
// // TODO  split to create and extendBase functions
// // would each derived need an own CorePipeline to not mess? - totally clueless for now
// // Factory function for creating custom pipeline classes with plugins
// function createPipeline(plugins = [], BasePipeline = Pipeline) {
// 	globalThis.DEBUG && console.log(plugins)
// 	return class extends BasePipeline {
// 		constructor (value) {
// 			super(value);
// 			//if(BasePipeline !== Pipeline)
// 		globalThis.LOGPROPS &&	console.log("BasePipeline", Object.getPrototypeOf(this),this._handler, )
//
// 			plugins.length  &&
// 				// Dynamically add plugins to the pipeline class
// 				plugins?.forEach((plugin) => {
// 					this[ plugin.name ] = (...args) => this.add(plugin, ...args);
// 				});
//
// 		}
// 	};
// }

// TODO TO TEST FOR INHERITANCE -create new testCases relying on this structure
// Function to create a base pipeline class and wrap it in a Proxy
function createPipelineClass(BasePipeline) {

	return class extends BasePipeline {
		constructor (value) {
			super(value); // Call the constructor of the BasePipeline class

			return new Proxy(this, pipelineHandler); // Return the proxied instance
		}





}
}

// Function to extend an existing pipeline class with additional plugins (to be added to the class itself)
function extendPipelineClass(BasePipeline, classPlugins = []) {
	class ExtendedPipeline extends BasePipeline {
		constructor (value) {
			super(value); // Call the constructor of the base class
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
export { BasePipeline,  createPipelineClass, extendPipelineClass }