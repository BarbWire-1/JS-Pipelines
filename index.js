// testing new approach for Base- and extending Pipelines

/* MIT License
* Copyright(c) 2025 Barbara Kälin
*/
import { BasePipeline, createPipelineClass, extendPipelineClass } from "./src/Pipeline.js";
import { logUncaught, getProps, dumpObject } from "./devUtils/debug.js";

globalThis.DUMP = false;
globalThis.DEVMODE = true;

// log all uncaught errors with stack in DEVMOE
globalThis.DEVMODE && logUncaught()

// simple BasePipeline NO plugins - only chaining on add()


const testBasePipe = new BasePipeline([ 15, 28, 2.4, 99 ])
const testBasePipeEnd = testBasePipe.add(arr => arr.map(n => n * 2)).add(arr => arr.map(n => parseInt(n))).end();
console.log({ testBasePipeEnd })//[30, 56, 4, 198]
DUMP && dumpObject(testBasePipe)

// 1. specialised BaseClass with some plugins on Pipeline

// MathBaseClass
// define the functions to plugin
const sum = (value, amount = 0) => value + amount;
const substract = (value, amount = 0) => value - amount;
const multiply = (value, factor = 1) => value * factor;

function divide(value, divisor = 1) {
	if (divisor === 0) {
		throw new Error('Division by zero is not possible.')
	}
	return  value / divisor;
}
const root = (value, nthRoot = 2) => Math.pow(value, 1 / nthRoot);
const exponentiate = (value, exponent = 2) => Math.pow(value, exponent);
const log = (value, base = 10) => Math.log(value / Math.log(base));
const round = () => Math.round(value);
const floor = () => Math.floor(value);
const ceil = () => Math.ceil(value);

const mathPlugins = [ sum, substract, multiply, divide, root, exponentiate, log, round, floor, ceil ]

const MathBasePipe = extendPipelineClass(BasePipeline, mathPlugins)

const testMathBasePipe = new MathBasePipe(20)
DUMP && dumpObject(testMathBasePipe)
const testMathBasePipeEnd = testMathBasePipe.sum(5).divide(10).end()
console.log({ testMathBasePipeEnd })

// checkInheritance
const test = new BasePipeline(20);
//test.sum(20) - undeined, so correctly deifined on MathBasePipe


// add another Plugin to the class
// MathBasePipe.addPlugin() // throws correctly for missing methodName
// define a new MathPlugin
const dec = (value, decimals) => value.toFixed(decimals);


const testPlugin = new MathBasePipe(100);

DUMP && dumpObject(testPlugin)
MathBasePipe.addPlugin(dec, 'dec');
DUMP && dumpObject(testPlugin)// dec registered in MathBasePipe now
const testPluginEnd = testPlugin.sum(900).divide(3).dec(2).end();
console.log(testPluginEnd)


const square = (value) => value*value
// extend the existing MathBasePipe
const extendedMathPipe = extendPipelineClass(MathBasePipe, [ square ]);
const extendedMathInstance = new extendedMathPipe(33);
DUMP && dumpObject(extendedMathInstance)

const extendedMathResult = extendedMathInstance.sum(5).square().end()
console.log(extendedMathResult)// 1444 :)))) LOOKS GOOD
