const checkMixedContent = (
  actionUrl,
  pageProtocol = window.location.protocol,
) => {
  if (
    pageProtocol === "https:" &&
    actionUrl &&
    typeof actionUrl === "string" &&
    actionUrl.startsWith("http:")
  ) {
    throw new Error(
      "Mixed Content: Cannot submit insecure HTTP form from a secure HTTPS page.",
    );
  }
};

export default checkMixedContent;
