/* eslint-disable react/require-default-props */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {Link} from "react-router-dom";
import {t} from "ttag";

export default class DoesNotExist extends React.Component {
  componentDidMount() {
    const {orgName, setTitle, page} = this.props;
    if (page !== undefined || orgName !== undefined)
      setTitle(t`404_PG_TITL`, orgName);
  }

  render() {
    const {orgSlug, page} = this.props;
    return (
      <div className="container content" id="not-foud-404">
        <div className="inner">
          <div className="main-column">
            <div className="inner">
              <div className="row owisp-404-row-1">
                {page && page.heading ? t`404_H` : "Oops!"}
              </div>
              <div className="row owisp-404-row-2">
                {page && page.sub_heading ? t`404_SUBH` : "404 Not Found"}
              </div>
              <div className="row owisp-404-row-3">
                {page && page.message
                  ? t`404_MESSAGE`
                  : "Sorry, an error has occurred, Requested page not found!"}
              </div>
              {page && page.homepage_link && (
                <div className="row owisp-404-row-4">
                  <Link to={`/${orgSlug}`} className="link">
                    {t`HOME_PG_LINK_TXT`}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
DoesNotExist.propTypes = {
  page: PropTypes.shape({
    heading: PropTypes.bool,
    sub_heading: PropTypes.bool,
    message: PropTypes.bool,
    homepage_link: PropTypes.bool,
  }),
  orgSlug: PropTypes.string,
  orgName: PropTypes.string,
  setTitle: PropTypes.func,
};
