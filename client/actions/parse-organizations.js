import {PARSE_ORGANIZATIONS} from "../constants/action-types";

const parseOrganizations = config => {
  return {
    type: PARSE_ORGANIZATIONS,
    payload: config,
  };
};
export default parseOrganizations;
