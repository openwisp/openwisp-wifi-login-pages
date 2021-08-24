import React from "react";

const getErrorField = (errors, key, nonField = false, className = "") =>
  errors[key] ? (
    <div className={!nonField ? `error ${className}` : "error non-field"}>
      <span className="icon">!</span>
      <span className="text">{errors[key]}</span>
    </div>
  ) : null;

export default getErrorField;
