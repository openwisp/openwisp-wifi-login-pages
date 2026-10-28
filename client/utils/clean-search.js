export const getSearch = (location) =>
  (location && location.search) ||
  (typeof window !== "undefined" && window.location
    ? window.location.search
    : "");

export const cleanSearch = (search, passwordlessTokenName) => {
  if (!search) return "";
  const params = new URLSearchParams(search);
  params.delete("username");
  params.delete("token");
  if (passwordlessTokenName) {
    params.delete(passwordlessTokenName);
  }
  params.delete("login_method");
  const remaining = params.toString();
  return remaining ? `?${remaining}` : "";
};

export default cleanSearch;
