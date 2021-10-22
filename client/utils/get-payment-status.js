import axios from "axios";
import {t} from "ttag";
import {paymentStatusUrl} from "../constants";
import logError from "./log-error";

const getPaymentStatus = async (orgSlug, paymentId, oneTimeToken) => {
  const url = paymentStatusUrl(orgSlug, paymentId);
  try {
    const response = await axios({
      method: "get",
      headers: {
        "content-type": "application/json",
        Authorization: `status_token ${oneTimeToken}`,
      },
      url,
    });
    if (response.status === 200) {
      return response.data.status;
    } else {
      logError("Cannot get payment status");
      return false;
    }
  } catch (error) {
    logError(error, t`ERR_OCCUR`);
    return false;
  }
};

export default getPaymentStatus;
