import axios from "axios";
import {t} from "ttag";
import {toast} from "react-toastify";
import {paymentStatusUrl} from "../constants";
import logError from "./log-error";
import getLanguageHeaders from "./get-language-headers";

export const getPaymentStatus = async (orgSlug, paymentId, auth_token, ws_token) => {
  const url = paymentStatusUrl(orgSlug, paymentId);

  try {
    const requestHeaders = {
      "content-type": "application/x-www-form-urlencoded",
      "accept-language": getLanguageHeaders(language),
      Authorization: `Bearer ${auth_token}`,
    };

    console.log(auth_token);

    if (userData.auth_token === undefined) {
      delete requestHeaders.Authorization;
    }

    if (req.headers.authorization) {
      requestHeaders.Authorization = req.headers.authorization;
    } else if (req.headers && req.headers.cookie) {
      requestHeaders.Cookie = req.headers.cookie;
    }

    const response = await axios({
      method: "get",
      headers: requestHeaders,
      params: {
        "get-token": "1",
        "token": ws_token,
      },
      url,
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
  const paymentStatus = await getPaymentStatus(orgSlug, paymentId, userData.auth_token);
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
