import React from "react";
import {t, gettext} from "ttag";

import "./plan.css";

const getPlan = (plan, index) => {
  /* disable ttag */
  const planTitle = gettext(plan.plan);
  const planDesc = gettext(plan.plan_description);
  const userLocale = navigator.language || navigator.userLanguage;
  const currencyFormatter = new Intl.NumberFormat(userLocale, {
    style: "currency",
    currency: plan.currency,
  });
  /* enable ttag */
  const pricingText = Number(plan.price)
    ? `${currencyFormatter.format(plan.price)} ${plan.pricing.replace(
        "(0 days)",
        "",
      )}`
    : "";
  return (
    <label htmlFor={`radio${index}`}>
      <span className="title">{planTitle}</span>
      <span className="desc">{planDesc}</span>
      {pricingText && <span className="price">{pricingText}</span>}
    </label>
  );
};

const getPlanSelection = (
  plans,
  selectedPlan,
  onChange,
  onFocus,
  hideSelection,
) => {
  let index = 0;
  return (
    <div className={`plans ${hideSelection ? "hidden" : ""}`}>
      <p className="intro">{t`PLAN_SETTING_TXT`}.</p>
      {plans.map((plan) => {
        const currentIndex = String(index);
        let planClass = "plan";
        if (selectedPlan === currentIndex) {
          planClass += " active";
        } else if (selectedPlan !== null && selectedPlan !== currentIndex) {
          planClass += " inactive";
        }
        index += 1;
        return (
          <div key={currentIndex} className={planClass}>
            <input
              id={`radio${currentIndex}`}
              type="radio"
              value={currentIndex}
              name="plan_selection"
              onChange={onChange}
              onFocus={onFocus}
              tabIndex={currentIndex}
            />
            {getPlan(plan, currentIndex)}
          </div>
        );
      })}
    </div>
  );
};

export default getPlanSelection;
