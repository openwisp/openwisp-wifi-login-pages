const logInternalError = (error) => {
  try {
    const config = {error};
    const errorText = `ERROR - Operation failed!\n${config.method} to ${config.url}\ncode: ${error.code}\nmessage: ${error.message}`;
    console.log(errorText);
  } catch {
    console.log(`ERROR: ${error}`);
  }
};
export default logInternalError;
