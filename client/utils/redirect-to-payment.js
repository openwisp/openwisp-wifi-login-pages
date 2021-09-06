import history from "./history";

const redirectToPayment = (orgSlug, routerHistory = history) =>
  routerHistory.push(`/${orgSlug}/payment/draft`);

export default redirectToPayment;
