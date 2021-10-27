function localStorageExists() {
  const t = "t";
  try {
    localStorage.setItem(t, t);
    localStorage.getItem(t);
    localStorage.removeItem(t, t);
    return !0;
  } catch (e) {
    return !1;
  }
}
if (!localStorageExists()) {
  let t = {};
  const e = {
    getItem(k) {
      return t[k] || null;
    },
    setItem(k, o) {
      t[k] = o;
    },
    removeItem(k) {
      return delete t[k];
    },
    clear() {
      t = {};
    },
  };
  window.localStorageMock = e;
  window.useLocalStorageMock = !0;
}
