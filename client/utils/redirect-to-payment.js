import history from "./history";

const redirectToPayment = (orgSlug) =>
  history.push(`/${orgSlug}/payment/draft`);

export default redirectToPayment;
