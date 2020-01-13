const getErrorText = (error, fallbackVal = "") => {
  const {data} = error.response;
  // eslint-disable-next-line no-nested-ternary
  return data.detail
    ? data.detail
    : data.non_field_errors
    ? data.non_field_errors[0]
    : fallbackVal;
};
export default getErrorText;
