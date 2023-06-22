import {combineReducers} from "redux";

import language from "./language";
import internetMode from "./internet-mode";
import {organization, organizations} from "./organization";

const rootReducer = combineReducers({
  organizations,
  organization,
  language,
  internetMode,
});
export default rootReducer;
