const getLanguageHeaders = (language) =>
  [
    language,
    ...(navigator.languages ? navigator.languages : [navigator.language]),
  ].join();

export default getLanguageHeaders;
