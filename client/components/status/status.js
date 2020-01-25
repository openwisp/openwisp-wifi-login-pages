import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import { Cookies } from "react-cookie";
import { Link } from 'react-router-dom';

import { validateApiUrl } from "../../constants";
import getText from "../../utils/get-text";
import Contact from "../contact-box";

export default class Status extends React.Component {
  componentDidMount() {
    const { cookies, orgSlug, logout } = this.props;
    const token = cookies.get(`${orgSlug}_auth_token`);
    const url = validateApiUrl.replace("{orgSlug}", orgSlug);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        token,
      }),
    })
      .then(response => {
        if (response.data["control:Auth-Type"] !== "Accept") {
          logout(cookies, orgSlug);
        }
      })
      .catch(() => {
        logout(cookies, orgSlug);
      });
  }

  render() {
    const { statusPage, language, orgSlug, logout, cookies } = this.props;
    const { content, links, buttons } = statusPage;
    const contentArr = getText(content, language).split("\n");
    return (
      <React.Fragment>
        <div className="owisp-status-container">
          <div className="owisp-status-inner">
            <div className="owisp-status-content-div">
              {contentArr.map(text => {
                if (text !== "")
                  return (
                    <div className="owisp-status-content-line" key={text}>
                      {text}
                    </div>
                  );
                return null;
              })}
              {buttons.logout ? (
                <>
                  {buttons.logout.label ? (
                    <>
                      <label
                        className="owisp-status-label owisp-status-label-logout-btn"
                        htmlFor="owisp-status-logout-btn"
                      >
                        <div className="owisp-status-label-text">
                          {getText(buttons.logout.label, language)}
                        </div>
                      </label>
                    </>
                  ) : null}
                  {links
                    ? links.map(link => (
                      <Link
                        className="owisp-status-link"
                        key={link.url}
                        to={link.url.replace("{orgSlug}", orgSlug)}
                      >
                        {getText(link.text, language)}
                      </Link>
                    ))
                    : null}
                  <input
                    type="button"
                    className="owisp-status-btn owisp-status-logout-btn"
                    id="owisp-status-logout-btn"
                    value={getText(buttons.logout.text, language)}
                    onClick={() => logout(cookies, orgSlug)}
                  />
                </>
              ) : null}
            </div>
            <div className="owisp-status-contact-div">
              <Contact />
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

Status.propTypes = {
  statusPage: PropTypes.shape({
    content: PropTypes.object,
    links: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.object,
        url: PropTypes.string,
      }),
    ),
    buttons: PropTypes.shape({
      logout: PropTypes.object,
    }),
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  logout: PropTypes.func.isRequired,
};
