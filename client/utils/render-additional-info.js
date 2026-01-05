import React from "react";
import {Link} from "react-router-dom";
import {t} from "ttag";

const renderAdditionalInfo = (text, orgSlug, component) => {
  const textNodes = [];
  const privacyPolicyTitle = t`PRIV_POL_TITL`;
  const termsAndConditionsTitle = t`TOS_TITL`;
  if (text.includes("{termsAndConditions}")) {
    const Array1 = text.split("{termsAndConditions}");
    if (Array1[0].includes("{privacyPolicy}")) {
      const Array2 = Array1[0].split("{privacyPolicy}");
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
    } else if (Array1[1].includes("{privacyPolicy}")) {
      const Array2 = Array1[1].split("{privacyPolicy}");
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
  } else if (text.includes("{privacyPolicy}")) {
    const Array1 = text.split("{privacyPolicy}");
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
