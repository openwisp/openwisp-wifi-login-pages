export const storageFallback = (storage) => {
  let data = {};

  return {
    getItem(key) {
      try {
        return storage.getItem(key);
      } catch {
        return data[key];
      }
    },
    setItem(key, val) {
      try {
        storage.setItem(key, val);
      } catch {
        data[key] = val;
      }
    },
    removeItem(key) {
      try {
        storage.removeItem(key);
      } catch {
        delete data[key];
      }
    },
    clear() {
      try {
        storage.clear();
      } catch {
        data = {};
      }
    },
  };
};

export const localStorage = storageFallback(window.localStorage);
export const sessionStorage = storageFallback(window.sessionStorage);
