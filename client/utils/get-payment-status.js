import qs from "qs";
import axios from "axios";
import {t} from "ttag";
import {paymentStatusUrl} from "../constants";
import logError from "./log-error";

const getPaymentStatus = async (orgSlug, paymentId, oneTimeToken) => {
  const url = paymentStatusUrl(orgSlug, paymentId);
  try {
    const response = await axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        oneTimeToken,
      }),
    });
    if (response.status === 200) {
      return response.data.status;
    }
    logError(response, "Cannot get payment status");
    return false;
  } catch (error) {
    logError(error, t`ERR_OCCUR`);
    return false;
  }
};

export default getPaymentStatus;
