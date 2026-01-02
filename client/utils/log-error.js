const logError = (error, errorText = "") => {
  if (Object.prototype.hasOwnProperty.call(error, "response")) {
    /* eslint-disable-next-line no-console */
    console.error(
      "Status",
      error.response.status,
      error.response.statusText,
      ":",
      errorText,
    );
  } else {
    /* eslint-disable-next-line no-console */
    console.log(error);
  }
};
export default logError;
