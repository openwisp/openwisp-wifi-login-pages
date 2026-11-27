import getParameterByName from "./get-parameter-by-name";

export const parseCredentials = (settings, search) => {
  let currentSearch = search;
  if (currentSearch === undefined) {
    currentSearch =
      typeof window !== "undefined" && window.location
        ? window.location.search
        : "";
  }
  const empty = {
    username: null,
    token: null,
    sesameToken: null,
    loginMethod: null,
  };
  if (!currentSearch || typeof currentSearch !== "string") {
    return empty;
  }
  const searchParams = new URLSearchParams(currentSearch);

  if (
    searchParams.getAll("username").length > 1 ||
    searchParams.getAll("token").length > 1
  ) {
    return empty;
  }

  const username = getParameterByName("username", currentSearch);
  const token = getParameterByName("token", currentSearch);

  const passwordlessTokenName =
    settings && settings.passwordless_auth_token_name;

  let sesameToken = null;
  if (passwordlessTokenName) {
    if (searchParams.getAll(passwordlessTokenName).length === 1) {
      sesameToken = getParameterByName(passwordlessTokenName, currentSearch);
    }
  }

  if (
    !sesameToken &&
    (!passwordlessTokenName || !searchParams.has(passwordlessTokenName))
  ) {
    const sidValues = searchParams.getAll("sid");
    if (sidValues.length === 1 && sidValues[0]) {
      [sesameToken] = sidValues;
    }
  }

  let loginMethod = null;
  if (searchParams.getAll("login_method").length === 1) {
    loginMethod = getParameterByName("login_method", currentSearch);
  }

  return {
    username,
    token,
    sesameToken,
    loginMethod,
  };
};

const hasIncomingCredentials = (settings, search, incomingCredentials) => {
  if (incomingCredentials) {
    const {username, token, sesameToken} = incomingCredentials;
    return Boolean((username && token) || sesameToken);
  }
  const parsed = parseCredentials(settings, search);
  return Boolean((parsed.username && parsed.token) || parsed.sesameToken);
};

export default hasIncomingCredentials;
