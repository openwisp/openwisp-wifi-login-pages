const getParameterByName = (name, url) => {
  const u = url || window.location.href;
  const name2 = name.replace(/[[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name2}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(u);
  if (!results) return null;
  if (!results[2]) return "";
  try {
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  } catch {
    return null;
  }
};
export default getParameterByName;
