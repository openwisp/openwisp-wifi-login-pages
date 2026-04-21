import axios from "axios";

import {updateMethodApiUrl} from "../constants";
import getLanguageHeaders from "./get-language-headers";

const updateRegistrationMethod = (orgSlug, method, authToken, language) =>
  axios({
    method: "post",
    headers: {
      "content-type": "application/json",
      "accept-language": getLanguageHeaders(language),
      Authorization: `Bearer ${authToken}`,
    },
    url: updateMethodApiUrl(orgSlug),
    data: {method},
  }).then((response) => response.data);

export default updateMethod;
