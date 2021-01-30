import React from "react";

const loader = (props) => {
    return(
        <div className={props.full==true ? "full-page-loader-container" : "loader-container"}>
            <div className="loader" />
        </div>
    );
};
export default loader;