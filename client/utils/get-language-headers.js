const getLanguageHeaders = (language) =>
  [language, ...navigator.languages].join();

export default getLanguageHeaders;
