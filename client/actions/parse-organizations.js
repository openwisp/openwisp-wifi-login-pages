import {PARSE_ORGANIZATIONS} from "../constants/action-types";

const parseOrganizations = config => {
  return dispatch => {
    dispatch({
      type: PARSE_ORGANIZATIONS,
      payload: config,
    });
  };
};
export default parseOrganizations;
