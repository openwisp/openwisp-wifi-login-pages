const getErrorText = (error, fallbackVal = "") => {
  const {data} = error.response;
  if (data.detail) {
    return data.detail;
  }
  if (data.non_field_errors) {
    return data.non_field_errors[0];
  }
  return fallbackVal;
};
export default getErrorText;
