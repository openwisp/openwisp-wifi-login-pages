/* eslint-disable react/no-danger */
import React from "react";
import getText from "./get-text";

const getHtml = (html, language, className = null, customStyles = {}) => {
  if (!html) return "";
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{__html: getText(html, language)}}
      style={customStyles}
    />
  );
};
export default getHtml;
