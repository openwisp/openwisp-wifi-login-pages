import {PARSE_ORGANIZATIONS} from "../constants/action-types";
import sortOrganizations from "../utils/sort-organizations";

const parseOrganizations = (config) => {
  return {
    type: PARSE_ORGANIZATIONS,
    payload: sortOrganizations(config),
  };
};
export default parseOrganizations;
