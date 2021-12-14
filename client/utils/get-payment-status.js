import axios from "axios";
import {t} from "ttag";
import {toast} from "react-toastify";
import {paymentStatusUrl} from "../constants";
import logError from "./log-error";

export const getPaymentStatus = async (orgSlug, paymentId, tokenInfo) => {
  const url = paymentStatusUrl(orgSlug, paymentId);
  const {tokenType, tokenValue} = tokenInfo;
  try {
    const response = await axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `${tokenType} ${tokenValue}`,
      },
      url,
    });
    if (response.status === 200) {
      if (response.data.message) {
        toast.error(response.data.message);
      }
      return response.data.status;
    }
    logError(response, "get-payment-status returned a non 200 response status");
    return false;
  } catch (error) {
    logError(error, "get-payment-status returned a non 200 response status");
    return false;
  }
};

const getPaymentStatusRedirectUrl = async (
  orgSlug,
  paymentId,
  tokenInfo,
  setUserData,
  userData,
) => {
  const paymentStatus = await getPaymentStatus(orgSlug, paymentId, tokenInfo);
  switch (paymentStatus) {
    case "waiting":
      return `/${orgSlug}/payment/draft`;
    case "success":
      if (setUserData && userData) {
        setUserData({
          ...userData,
          is_verified: true,
          payment_url: null,
          mustLogin: true,
        });
      }
      return `/${orgSlug}/payment/${paymentStatus}`;
    case "failed":
      setUserData({...userData, payment_url: null});
      return `/${orgSlug}/payment/${paymentStatus}`;
    default:
      // Request failed
      toast.error(t`ERR_OCCUR`);
      setUserData({...userData, payment_url: null});
      return `/${orgSlug}/payment/failed`;
  }
};

export default getPaymentStatusRedirectUrl;
