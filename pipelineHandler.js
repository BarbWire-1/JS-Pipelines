import isModifyingMethod from './modifyingMethods.js';

export const pipelineHandler = {
	get: (target, prop) => {
		if (typeof target[ prop ] === "function" && isModifyingMethod(prop)) {
			return (...args) => {
				const result = target[ prop ](...args);
				return target; // Allow chaining
			};
		} else {
			return target[ prop ];
		}
	}
};