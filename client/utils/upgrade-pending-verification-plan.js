import axios from "axios";

import {upgradePlanApiUrl} from "../constants";
import getLanguageHeaders from "./get-language-headers";

const upgradePendingVerificationPlan = (
  orgSlug,
  planPricing,
  authToken,
  language,
) =>
  axios({
    method: "post",
    headers: {
      "content-type": "application/json",
      "accept-language": getLanguageHeaders(language),
      Authorization: `Bearer ${authToken}`,
    },
    url: upgradePlanApiUrl.replace("{orgSlug}", orgSlug),
    data: {
      plan_pricing: planPricing,
    },
  }).then((response) => response.data);

export default upgradePendingVerificationPlan;
