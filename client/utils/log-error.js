const logError = (error, errorText = "") => {
  console.error(
    'Status',
    error.response.status,
    error.response.statusText,
    ':',
    errorText
  );
};
export default logError;
