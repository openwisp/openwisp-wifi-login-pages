import React from "react";

const loader = (props) => {
  const {full = true, small = false} = props;
  let css = "loader-container";
  if (full) css = `${css} full`;
  if (small) css += " small";
  return (
    <div data-testid="loader-container" className={css}>
      <div className="loader" />
    </div>
  );
};
export default loader;
