import {combineReducers} from "redux";

import setLanguage from "./language";
import {parseOrganizations, setOrganization} from "./organization";

const rootReducer = combineReducers({
  organizations: parseOrganizations,
  organization: setOrganization,
  language: setLanguage,
});
export default rootReducer;
