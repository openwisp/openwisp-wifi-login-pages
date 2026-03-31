import React from "react";
import PropTypes from "prop-types";
import {t} from "ttag";
import {filesize} from "filesize";

/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
const TIME_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
  hour12: false,
};

const getDuration = (seconds) => {
  const number = Number(seconds);
  if (Number.isNaN(number) || number === 0) {
    return "0 secs";
  }
  const h = Math.floor(number / 3600);
  const m = Math.floor((number % 3600) / 60);
  const s = Math.floor((number % 3600) % 60);
  const hDisplay = h > 0 ? h + (h === 1 ? " hr " : " hrs ") : "";
  const mDisplay = m > 0 ? m + (m === 1 ? " min " : " mins ") : "";
  const sDisplay = s > 0 ? s + (s === 1 ? " sec " : " secs ") : "";
  const result = hDisplay + mDisplay + sDisplay;
  return result || "0 secs";
};

const getDateTimeFormat = (language, time_option, date) => {
  if (typeof Intl !== "undefined") {
    return new Intl.DateTimeFormat(language, time_option).format(
      new Date(date),
    );
  }
  return String(new Date(date));
};

const getOctets = (session, statusPage) => {
  const {accounting_swap_octets} = statusPage;
  return accounting_swap_octets
    ? {
        downloadOctets: session.output_octets,
        uploadOctets: session.input_octets,
      }
    : {
        downloadOctets: session.input_octets,
        uploadOctets: session.output_octets,
      };
};

const formatOctets = (value) =>
  filesize(value, {
    round: 0,
  });

const getSessionInfo = () => ({
  header: {
    start_time: t`ACCT_START_TIME`,
    stop_time: t`ACCT_STOP_TIME`,
    duration: t`ACCT_DURATION`,
    download: t`ACCT_DOWNLOAD`,
    upload: t`ACCT_UPLOAD`,
    device_address: t`ACCT_DEVICE_ADDRESS`,
  },
  settings: {
    active_session: t`ACCT_ACTIVE`,
  },
});
/* eslint-enable class-methods-use-this */

const getLargeTableRow = (
  session,
  sessionSettings,
  showLogoutButton,
  language,
  statusPage,
  handleSessionLogout,
) => {
  const {downloadOctets, uploadOctets} = getOctets(session, statusPage);
  const activeSessionText = t`ACCT_ACTIVE`;

  return (
    <>
      <td>{getDateTimeFormat(language, TIME_OPTIONS, session.start_time)}</td>
      <td>
        {session.stop_time === null
          ? activeSessionText
          : getDateTimeFormat(language, TIME_OPTIONS, session.stop_time)}
      </td>
      <td>{getDuration(session.session_time)}</td>
      <td>{formatOctets(downloadOctets)}</td>
      <td>{formatOctets(uploadOctets)}</td>
      <td>
        {session.calling_station_id}
        {session.stop_time === null && showLogoutButton && (
          <input
            type="button"
            className="button small session-logout"
            value={t`LOGOUT`}
            onClick={() => {
              handleSessionLogout(session);
            }}
          />
        )}
      </td>
    </>
  );
};

const getSmallTableRow = (
  session,
  session_info,
  showLogoutButton,
  language,
  statusPage,
  handleSessionLogout,
) => {
  const {downloadOctets, uploadOctets} = getOctets(session, statusPage);
  const activeSessionText = session_info.settings.active_session;

  return (
    <tbody key={session.session_id}>
      <tr
        key={`${session.session_id}start_time`}
        className={session.stop_time === null ? "active-session" : ""}
      >
        <th>{session_info.header.start_time}:</th>
        <td>{getDateTimeFormat(language, TIME_OPTIONS, session.start_time)}</td>
      </tr>
      <tr
        key={`${session.session_id}stop_time`}
        className={session.stop_time === null ? "active-session" : ""}
      >
        <th>{session_info.header.stop_time}:</th>
        <td>
          {session.stop_time === null
            ? activeSessionText
            : getDateTimeFormat(language, TIME_OPTIONS, session.stop_time)}
        </td>
      </tr>
      <tr
        key={`${session.session_id}duration`}
        className={session.stop_time === null ? "active-session" : ""}
      >
        <th>{session_info.header.duration}:</th>
        <td>{getDuration(session.session_time)}</td>
      </tr>
      <tr
        key={`${session.session_id}download`}
        className={session.stop_time === null ? "active-session" : ""}
      >
        <th>{session_info.header.download}:</th>
        <td>{formatOctets(downloadOctets)}</td>
      </tr>
      <tr
        key={`${session.session_id}upload`}
        className={session.stop_time === null ? "active-session" : ""}
      >
        <th>{session_info.header.upload}:</th>
        <td>{formatOctets(uploadOctets)}</td>
      </tr>
      <tr
        key={`${session.session_id}device_address`}
        className={session.stop_time === null ? "active-session" : ""}
      >
        <th>{session_info.header.device_address}:</th>
        <td>{session.calling_station_id}</td>
      </tr>
      {session.stop_time === null && showLogoutButton && (
        <tr key={`${session.session_id}logout`} className="active-session">
          <td className="row logout" colSpan="2">
            <input
              type="button"
              className="button full"
              value={t`LOGOUT`}
              onClick={() => {
                handleSessionLogout(session);
              }}
              aria-label={t`LOGOUT`}
            />
          </td>
        </tr>
      )}
    </tbody>
  );
};

function SessionsTable({
  activeSessions,
  pastSessions,
  language,
  statusPage,
  captivePortalLogoutForm,
  screenWidth,
  handleSessionLogout,
}) {
  const session_info = getSessionInfo();
  const showLogoutButton =
    captivePortalLogoutForm.logout_by_session && activeSessions.length > 1;

  if (screenWidth > 656) {
    return (
      <table className="large-table bg">
        <thead>
          <tr>
            {Object.keys(session_info.header).map((key) => (
              <th key={key}>{session_info.header[key]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeSessions.map((session) => (
            <tr
              key={session.session_id}
              className={session.stop_time === null ? "active-session" : ""}
            >
              {getLargeTableRow(
                session,
                session_info.settings,
                showLogoutButton,
                language,
                statusPage,
                handleSessionLogout,
              )}
            </tr>
          ))}
          {pastSessions.map((session) => (
            <tr
              key={session.session_id}
              className={session.stop_time === null ? "active-session" : ""}
            >
              {getLargeTableRow(
                session,
                session_info.settings,
                false,
                language,
                statusPage,
                handleSessionLogout,
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className="small-table bg">
      {activeSessions.map((session) =>
        getSmallTableRow(
          session,
          session_info,
          showLogoutButton,
          language,
          statusPage,
          handleSessionLogout,
        ),
      )}
      {pastSessions.map((session) =>
        getSmallTableRow(
          session,
          session_info,
          false,
          language,
          statusPage,
          handleSessionLogout,
        ),
      )}
    </table>
  );
}

SessionsTable.propTypes = {
  activeSessions: PropTypes.array.isRequired,
  pastSessions: PropTypes.array.isRequired,
  language: PropTypes.string.isRequired,
  statusPage: PropTypes.shape({
    accounting_swap_octets: PropTypes.bool,
  }).isRequired,
  captivePortalLogoutForm: PropTypes.shape({
    logout_by_session: PropTypes.bool.isRequired,
  }).isRequired,
  screenWidth: PropTypes.number.isRequired,
  handleSessionLogout: PropTypes.func.isRequired,
};

export default SessionsTable;
