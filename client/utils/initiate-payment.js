import axios from "axios";
import {toast} from "react-toastify";
import {initiatePaymentUrl} from "../constants";
import logError from "./log-error";

export const initiatePayment = async (orgSlug, data, tokenInfo) => {
  const url = initiatePaymentUrl(orgSlug);
  const {tokenType, tokenValue} = tokenInfo;
  try {
    const response = await axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `${tokenType} ${tokenValue}`,
      },
      url,
      data: data,
    });

    if (response.status === 200) {
      if (response.data.message) {
        if (response.data.status === "failed") {
          toast.error(response.data.message);
        } else {
          toast.info(response.data.message);
        }
      }
      return response.data.status;
    }
    logError(response, "initiate-payment-status returned a non 200 response status");
    return false;
  } catch (error) {
    logError(error, "initiate-payment-status returned a non 200 response status");
    return false;
  }
};
