import React from "react";

const getError = (errors, key = null) => {
  const errorKey = key === null ? "nonField" : key;
  return errors[errorKey] ? (
    <div className={key !== null ? `error ${key}` : "error non-field"}>
      <span className="icon">!</span>
      <span className="text">{errors[errorKey]}</span>
    </div>
  ) : null;
};

export default getError;
