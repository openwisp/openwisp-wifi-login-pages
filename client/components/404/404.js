/* eslint-disable react/require-default-props */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {Link} from "react-router-dom";

import getText from "../../utils/get-text";

export default class DoesNotExist extends React.Component {
  render() {
    const {orgSlug, language, page} = this.props;
    return (
      <>
        <div className="owisp-404-container">
          <div className="owisp-404-row-1">
            {page && page.heading ? getText(page.heading, language) : "Oops!"}
          </div>
          <div className="owisp-404-row-2">
            {page && page.sub_heading
              ? getText(page.sub_heading, language)
              : "404 Not Found"}
          </div>
          <div className="owisp-404-row-3">
            {page && page.message
              ? getText(page.message, language)
              : "Sorry, an error has occurred, Requested page not found!"}
          </div>
          {page && page.homepage_link ? (
            <div className="owisp-404-row-4">
              <Link to={`/${orgSlug}`}>
                {getText(page.homepage_link.text, language)}
              </Link>
            </div>
          ) : null}
        </div>
      </>
    );
  }
}
DoesNotExist.propTypes = {
  page: PropTypes.shape({
    heading: PropTypes.object,
    sub_heading: PropTypes.object,
    message: PropTypes.object,
    homepage_link: PropTypes.object,
  }),
  language: PropTypes.string,
  orgSlug: PropTypes.string,
};
