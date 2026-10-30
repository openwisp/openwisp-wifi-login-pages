import getParameterByName from "./get-parameter-by-name";

const hasIncomingCredentials = (settings, search, incomingCredentials) => {
  let currentSearch = search;
  if (currentSearch === undefined) {
    currentSearch =
      typeof window !== "undefined" && window.location
        ? window.location.search
        : "";
  }
  if (incomingCredentials) {
    const {username, token, sesameToken} = incomingCredentials;
    return Boolean((username && token) || sesameToken);
  }
  return Boolean(
    (getParameterByName("username", currentSearch) &&
      getParameterByName("token", currentSearch)) ||
    (settings &&
      settings.passwordless_auth_token_name &&
      getParameterByName(settings.passwordless_auth_token_name, currentSearch)),
  );
};

export default hasIncomingCredentials;
