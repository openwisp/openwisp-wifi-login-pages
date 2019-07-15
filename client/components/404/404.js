import "./index.css";

import React from "react";

export default class DoesNotExist extends React.Component {
  render() {
    return (
      <React.Fragment>
        <div className="owisp-404-container">
          <div className="owisp-404-row-1">Oops!</div>
          <div className="owisp-404-row-2">404 Not Found</div>
          <div className="owisp-404-row-3">
            Sorry, an error has occurred, Requested page not found!
          </div>
        </div>
      </React.Fragment>
    );
  }
}
