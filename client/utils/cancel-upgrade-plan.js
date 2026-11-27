import axios from "axios";

import {cancelUpgradePlanApiUrl} from "../constants";
import getLanguageHeaders from "./get-language-headers";

const cancelUpgradePlan = (orgSlug, authToken, language) =>
  axios({
    method: "post",
    headers: {
      "content-type": "application/json",
      "accept-language": getLanguageHeaders(language),
      Authorization: `Bearer ${authToken}`,
    },
    url: cancelUpgradePlanApiUrl.replace("{orgSlug}", orgSlug),
  }).then((response) => response.data);

export default cancelUpgradePlan;
