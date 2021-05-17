const handleSession = (orgSlug, token, cookies) => {
  /*
  This function is created while implementation of remember me checkbox
  It is used to check whether sessionStorage or cookies is used to store
  the token. If session storage is used then it will clear the cookies
  and returns the token with session - true else it returns the token
  with session - false.
  */
  const sessionKey = sessionStorage.getItem(`${orgSlug}_auth_token`);
  if (sessionKey) {
    cookies.remove(`${orgSlug}_auth_token`, {path: "/"});
    return {
      token: sessionKey,
      session: true,
    };
  }
  return {
    token,
    session: false,
  };
};

export default handleSession;
