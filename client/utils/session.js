const handleSession = (orgSlug, token, cookies) => {
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
