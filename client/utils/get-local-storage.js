const localStorage = () =>
  window.useLocalStorageMock ? window.localStorageMock : window.localStorage;

export default localStorage();
