

// average time over n iterations
function measureAverageTime(label, fn, iterations = 1) {
	let totalTime = 0;
	let finalResult;
	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		finalResult = fn();
		const end = performance.now();
		totalTime += end - start;
	}
	const averageTime = totalTime / iterations;
	console.log(
		`${label}: ${averageTime.toFixed(
			2
		)} ms (average over ${iterations} runs)`
	);
	console.log(`${label} Final Result:`, finalResult);
	return averageTime;
}
