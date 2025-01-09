/* MIT License
* Copyright(c) 2025 Barbara Kälin
*/

const modifyingMethods = [
	// Array methods
	"push",
	"pop",
	"shift",
	"unshift",
	"splice",
	"reverse",
	"sort",
	"fill",
	"copyWithin",
	"reduce",

	// String methods (though strings are immutable, these can be used to modify the string)
	"replace",
	"slice",
	"toLowerCase",
	"toUpperCase",

	// Object methods
	"assign",
	"defineProperty",
	"delete",

	// Set and Map methods
	"add",
	"delete",
	"clear",
	"set",

	// Typed array methods
	"set",
	"fill",

	// WeakMap and WeakSet methods
	"set",
	"delete",
	"add"
];

export default function isModifyingMethod(methodName) {
	return modifyingMethods.includes(methodName);
}