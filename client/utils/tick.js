const tick = function () {
  return new Promise((resolve) => {
    process.nextTick(resolve);
  });
};

export default tick;
