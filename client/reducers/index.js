import {combineReducers} from "redux";

import language from "./language";
import {organization, organizations} from "./organization";

const rootReducer = combineReducers({
  organizations,
  organization,
  language,
});
export default rootReducer;
