import React from "react";
import {Link} from "react-router-dom";
import {t} from "ttag";

const renderAdditionalInfo = (text, orgSlug, component) => {
  const textNodes = [];
  const privacyPolicyTitle = t`PRIV_POL_TITL`;
  const termsAndConditionsTitle = t`TOS_TITL`;
  if (text.includes("{terms_and_conditions}")) {
    const Array1 = text.split("{terms_and_conditions}");
    if (Array1[0].includes("{privacy_policy}")) {
      const Array2 = Array1[0].split("{privacy_policy}");
      textNodes.push(Array2[0]);
      textNodes.push(
        <Link
          to={`/${orgSlug}/${component}/privacy-policy`}
          className={`link additional ${component}`}
          key="privacy-policy"
        >
          {privacyPolicyTitle}
        </Link>,
      );
      textNodes.push(Array2[1]);
      textNodes.push(
        <Link
          to={`/${orgSlug}/${component}/terms-and-conditions`}
          className={`link additional ${component}`}
          key="terms-and-conditions"
        >
          {termsAndConditionsTitle}
        </Link>,
      );
      textNodes.push(Array1[1]);
    } else if (Array1[1].includes("{privacy_policy}")) {
      const Array2 = Array1[1].split("{privacy_policy}");
      textNodes.push(Array1[0]);
      textNodes.push(
        <Link
          to={`/${orgSlug}/${component}/terms-and-conditions`}
          className={`link additional ${component}`}
          key="terms-and-conditions"
        >
          {termsAndConditionsTitle}
        </Link>,
      );
      textNodes.push(Array2[0]);
      textNodes.push(
        <Link
          to={`/${orgSlug}/${component}/privacy-policy`}
          className={`link additional ${component}`}
          key="privacy-policy"
        >
          {privacyPolicyTitle}
        </Link>,
      );
      textNodes.push(Array2[1]);
    } else {
      textNodes.push(Array1[0]);
      textNodes.push(
        <Link
          to={`/${orgSlug}/${component}/terms-and-conditions`}
          className={`link additional ${component}`}
          key="terms-and-conditions"
        >
          {termsAndConditionsTitle}
        </Link>,
      );
      textNodes.push(Array1[1]);
    }
  } else if (text.includes("{privacy_policy}")) {
    const Array1 = text.split("{privacy_policy}");
    textNodes.push(Array1[0]);
    textNodes.push(
      <Link
        to={`/${orgSlug}/${component}/privacy-policy`}
        className={`link additional ${component}`}
        key="privacy-policy"
      >
        {privacyPolicyTitle}
      </Link>,
    );
    textNodes.push(Array1[1]);
  } else {
    textNodes.push(text);
  }
  return textNodes;
};
export default renderAdditionalInfo;
