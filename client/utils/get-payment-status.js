import qs from "qs";
import axios from "axios";
import {t} from "ttag";
import {paymentStatusUrl} from "../constants";
import logError from "./log-error";
import handleSession from "./session";

export const getPaymentStatus = async (orgSlug, paymentId, userData) => {
  const url = paymentStatusUrl(orgSlug, paymentId);
  const {tokenType} = userData;
  let data;
  if (userData.type === "Bearer") {
    const {cookies} = userData;
    const authToken = cookies.get(`${orgSlug}_auth_token`);
    const {token: tokenValue, session} = handleSession(
      orgSlug,
      authToken,
      cookies,
    );
    data = {
      tokenType: userData.type,
      tokenValue,
      session,
    };
  } else {
    const {tokenValue} = userData;
    data = {
      tokenType,
      tokenValue,
    };
  }
  try {
    const response = await axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        ...data,
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
        });
      }
      return `/${orgSlug}/payment/${paymentStatus}`;
    case "failed":
      return `/${orgSlug}/payment/${paymentStatus}`;
    default:
      return null;
  }
};

export default getPaymentStatusRedirectUrl;
