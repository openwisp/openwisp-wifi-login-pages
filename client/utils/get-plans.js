import axios from "axios";
import {toast} from "react-toastify";
import {t} from "ttag";
import getLanguageHeaders from "./get-language-headers";
import {plansApiUrl} from "../constants";
import logError from "./log-error";

const getPlans = async (orgSlug, language, successCallback) => {
  const plansUrl = plansApiUrl.replace("{orgSlug}", orgSlug);
  axios({
    method: "get",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "accept-language": getLanguageHeaders(language),
    },
    url: plansUrl,
    data: {},
  })
    .then((response) => successCallback(response.data))
    .catch((error) => {
      toast.error(t`ERR_OCCUR`);
      logError(error, "Error while fetching plans");
    });
};

export default getPlans;
