const logError = (error, errorText = "") => {
  if (Object.prototype.hasOwnProperty.call(error, 'response')) {
    console.error(
      'Status',
      error.response.status,
      error.response.statusText,
      ':',
      errorText
    );
  } else {
    console.log(error);
  }
};
export default logError;
