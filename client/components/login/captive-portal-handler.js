function _getParam(name) {
    if (name = (new RegExp("[?&]" + encodeURIComponent(name) + "=([^&]*)")).exec(location.search))
      return decodeURIComponent(name[1]);
  } 
  export default function handleCaptivePortalLogin(captivePortalLoginForm, setCaptivePortalError) {
    const res = _getParam("res");
    const reply = _getParam("reply"); 
    if (res === "failed" && reply) {
      setCaptivePortalError({
        type: "authError",
        message: reply,
      });
    } else {
      setCaptivePortalError(null);
    }
  }
