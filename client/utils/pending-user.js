const isPendingUserExpired = (pendingUser) => {
  if (!pendingUser) return false;
  if (pendingUser.expiresAt) {
    return Date.now() > pendingUser.expiresAt;
  }
  if (pendingUser.readyAt) {
    return Date.now() > pendingUser.readyAt + 60000;
  }
  return false;
};

export default isPendingUserExpired;
