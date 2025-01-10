/* MIT License
* Copyright(c) 2025 Barbara Kälin
*/
import isModifyingMethod from './utils/modifyingMethods.js';
// TODO not tested yet on modiying methods of all types
export const pipelineHandler = {
	get: (target, prop) => {
		// traverse prototype chain to find the property/method
		let currentTarget = target;
		while (currentTarget !== null) {
			if (prop in currentTarget) {
				const propValue = currentTarget[ prop ];

				//  modifying method, return the chaining behavior
				if (typeof propValue === 'function' && isModifyingMethod(prop)) {
					return (...args) => {
						const result = propValue.apply(target, args);  // apply to target instance
						return target; // Allow chaining
					};
				}

				// otherwise, pass the property as-is
				return propValue;
			}
			currentTarget = Object.getPrototypeOf(currentTarget);
		}

		// TODO catch all undefined
		//return undefined;
	}
};