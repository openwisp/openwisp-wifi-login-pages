// Route paths shared by the router and the login continuation (`?next=`)
// validation. Only routes flagged with `continuation` can be used as
// destination; `statuses` restricts the allowed values of a `:status` param.
const routes = {
  root: {path: ""},
  notFound: {path: "*"},
  registration: {path: "registration/*"},
  verification: {path: "mobile-phone-verification"},
  passwordConfirm: {path: "password/reset/confirm/:uid/:token"},
  passwordReset: {path: "password/reset"},
  login: {path: "login/*"},
  status: {path: "status", continuation: true},
  logout: {path: "logout"},
  passwordChange: {path: "change-password", continuation: true},
  phoneChange: {path: "change-phone-number", continuation: true},
  paymentProcess: {path: "payment/process/", continuation: true},
  paymentStatus: {
    path: "payment/:status",
    continuation: true,
    statuses: ["draft", "success", "failed"],
  },
  signup: {path: "complete-signup"},
};

export default routes;
