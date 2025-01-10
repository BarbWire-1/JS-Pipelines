/* MIT License
* Copyright(c) 2025 Barbara Kälin
*/


import isModifyingMethod from './utils/modifyingMethods.js';
// TODO not tested yet on modiying methods of all types
export const pipelineHandler = {
	get: (target, prop) => {
		//console.log(prop
			if (prop in target) {

				const propValue = target[ prop ];

				//  modifying method, return the chaining behavior
				if (typeof propValue === 'function' && isModifyingMethod(prop)) {

					return (...args) => {
						propValue.apply(target, args);  // apply to target instance
						return target; // Allow chaining
					};
				}

				// otherwise, pass the property as-is
				return propValue;
			}


		// TODO catch all undefined
		return undefined;
	}
};