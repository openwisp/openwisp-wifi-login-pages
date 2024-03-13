import {combineReducers} from "redux";

import language from "./language";
import internetMode from "./internet-mode";
import planExhausted from "./plan-exhausted";
import {organization, organizations} from "./organization";

const rootReducer = combineReducers({
  organizations,
  organization,
  language,
  internetMode,
  planExhausted,
});
export default rootReducer;
