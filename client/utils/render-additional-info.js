import React from "react";
import {Link} from "react-router-dom";

import getText from "./get-text";

const renderAdditionalInfo = (
  textObj,
  language,
  termsAndConditions,
  privacyPolicy,
  orgSlug,
  component,
) => {
  const textNodes = [];
  const text = getText(textObj, language);
  const privacyPolicyTitle = getText(privacyPolicy.title, language);
  const termsAndConditionsTitle = getText(termsAndConditions.title, language);
  if (text.includes("{terms_and_conditions}")) {
    const Array1 = text.split("{terms_and_conditions}");
    if (Array1[0].includes("{privacy_policy}")) {
      const Array2 = Array1[0].split("{privacy_policy}");
      textNodes.push(Array2[0]);
      textNodes.push(
        <Link
          to={`/${orgSlug}/${component}/privacy-policy`}
          className={`owisp-${component}-additional-link`}
          key="privacy-policy"
        >
          {privacyPolicyTitle}
        </Link>,
      );
      textNodes.push(Array2[1]);
      textNodes.push(
        <Link
          to={`/${orgSlug}/${component}/terms-and-conditions`}
          className={`owisp-${component}-additional-link`}
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
          className={`owisp-${component}-additional-link`}
          key="terms-and-conditions"
        >
          {termsAndConditionsTitle}
        </Link>,
      );
      textNodes.push(Array2[0]);
      textNodes.push(
        <Link
          to={`/${orgSlug}/${component}/privacy-policy`}
          className={`owisp-${component}-additional-link`}
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
          className={`owisp-${component}-additional-link`}
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
        className={`owisp-${component}-additional-link`}
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
