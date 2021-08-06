import {PARSE_ORGANIZATIONS} from "../constants/action-types";
import sortOrganizations from "../utils/sort-organizations";

const parseOrganizations = (organizations) => ({
  type: PARSE_ORGANIZATIONS,
  payload: sortOrganizations(organizations),
});
export default parseOrganizations;
