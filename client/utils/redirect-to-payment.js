import history from "./history";
import {getPaymentRoute} from "./payment";

const redirectToPayment = (orgSlug, navigate, userData, settings) => {
  const redirect = navigate || history.push;
  return redirect(
    userData
      ? getPaymentRoute(orgSlug, userData, settings)
      : `/${orgSlug}/payment/draft`,
  );
};

export default redirectToPayment;
