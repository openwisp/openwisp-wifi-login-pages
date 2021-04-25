const logInternalError = (error) => {
  const errorText = `ERROR - Operation failed!\n${error.config.method} to ${error.config.url}\ncode: ${error.code}`;
  console.log(errorText);
};
export default logInternalError;
