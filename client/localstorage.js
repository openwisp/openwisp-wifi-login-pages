let data = {};
const localStorage = {
  getItem: (key) => data[key] || null,
  setItem: (key, val) => {
    data[key] = val;
  },
  removeItem: (key) => delete data[key],
  clear: () => {
    data = {};
  },
};

export default localStorage;
