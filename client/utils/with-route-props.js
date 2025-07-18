import React from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";

function withRouteProps(Component) {
  return function (props) {
    return (
      <Component
        {...props}
        location={useLocation()}
        params={useParams()}
        navigate={useNavigate()}
      />
    );
  };
}

export default withRouteProps;
