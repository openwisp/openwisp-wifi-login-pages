import history from "./history";

const redirectToPayment = (orgSlug, navigate = history.push) =>
  navigate(`/${orgSlug}/payment/draft`);

export default redirectToPayment;
