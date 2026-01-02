const tick = function tick() {
  return new Promise((resolve) => {
    // Use process.nextTick in Node.js environment (for tests)
    // Use Promise microtask in browser environment
    if (typeof process !== "undefined" && process.nextTick) {
      process.nextTick(resolve);
    } else {
      // Promise.resolve().then() schedules a microtask, similar to process.nextTick
      Promise.resolve().then(resolve);
    }
  });
};

export default tick;
