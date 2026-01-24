import React from "react";
import getText from "./get-text";

const getHtml = (html, language, className = null) => {
  if (!html) return "";
  return (
    <div
      className={className}
      data-testid={className}
      dangerouslySetInnerHTML={{__html: getText(html, language)}}
    />
  );
};
export default getHtml;
