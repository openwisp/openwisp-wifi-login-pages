const getUrlParam = (paramName) => {
  const searchRegex = new RegExp(
    `[?&]${encodeURIComponent(paramName)}=([^&]*)`,
  );
  const match = searchRegex.exec(window.location.search);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
};

export default function handleCaptivePortalLogin(
  captivePortalLoginForm,
  setCaptivePortalError,
) {
  const res = getUrlParam("res");
  const reply = getUrlParam("reply");

  if (res === "failed" && reply) {
    setCaptivePortalError({
      type: "authError",
      message: reply,
    });
  } else {
    setCaptivePortalError(null);
  }
}
