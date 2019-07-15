const getText = (textObject, language) => {
  if (textObject[language]) return textObject[language];
  // return text in english if not provided
  return textObject.en;
};
export default getText;
