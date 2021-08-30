/* eslint-disable camelcase */
import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import React, {Suspense} from "react";
import Select from "react-select";
import {Link, Route} from "react-router-dom";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import countryList from "react-select-country-list";
import {t, gettext} from "ttag";
import "react-phone-input-2/lib/style.css";
import LoadingContext from "../../utils/loading-context";
import PasswordToggleIcon from "../../utils/password-toggle";
import {mainToastId, registerApiUrl, plansApiUrl} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import submitOnEnter from "../../utils/submit-on-enter";
import renderAdditionalInfo from "../../utils/render-additional-info";
import Contact from "../contact-box";
import Modal from "../modal";
import getError from "../../utils/get-error";
import getLanguageHeaders from "../../utils/get-language-headers";

const PhoneInput = React.lazy(() => import("react-phone-input-2"));

export default class Registration extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phone_number: "",
      email: "",
      username: "",
      password1: "",
      password2: "",
      first_name: "",
      last_name: "",
      location: "",
      birth_date: "",
      errors: {},
      success: false,
      plans: [],
      plansFetched: false,
      selectedPlan: null,
      tax_number: "",
      street: "",
      city: "",
      zipcode: "",
      country: "",
      countrySelected: {},
      hidePassword: true,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.passwordToggleRef = React.createRef();
    this.confirmPasswordToggleRef = React.createRef();
    this.changePlan = this.changePlan.bind(this);
    this.selectedCountry = this.selectedCountry.bind(this);
  }

  componentDidMount() {
    const {orgSlug, settings, setTitle, orgName, language} = this.props;
    const {setLoading} = this.context;
    const plansUrl = plansApiUrl.replace("{orgSlug}", orgSlug);

    setTitle(t`REGISTRATION_TITL`, orgName);

    if (settings.subscriptions) {
      setLoading(true);
      axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "accept-language": getLanguageHeaders(language),
        },
        url: plansUrl,
      })
        .then((response) => {
          this.setState({plans: response.data, plansFetched: true});
          setLoading(false);
        })
        .catch((error) => {
          toast.error(t`ERR_OCCUR`);
          logError(error, "Error while fetching plans");
        });
    }
  }

  handleChange(event) {
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    event.preventDefault();
    const {orgSlug, authenticate, settings, language} = this.props;
    const {
      phone_number,
      email,
      username,
      first_name,
      last_name,
      birth_date,
      location,
      password1,
      password2,
      errors,
      selectedPlan,
      plans,
      tax_number,
      street,
      city,
      zipcode,
      country,
    } = this.state;

    if (password1 !== password2) {
      this.setState({
        errors: {
          password2: t`PWD_CNF_ERR`,
        },
      });
      return false;
    }

    this.setState({errors: {...errors, password2: null}});
    const url = registerApiUrl.replace("{orgSlug}", orgSlug);
    // prepare post data
    const postData = {
      email,
      username: email,
      first_name,
      last_name,
      birth_date,
      location,
      password1,
      password2,
    };
    const optional_fields = {
      first_name,
      last_name,
      birth_date,
      location,
    };
    Object.keys(optional_fields).forEach((key) => {
      if (optional_fields[key].length > 0) {
        postData[key] = optional_fields[key];
      }
    });
    let plan_pricing;
    if (selectedPlan !== null) {
      plan_pricing = plans[selectedPlan];
      postData.plan_pricing = plan_pricing.id;
      postData.requires_payment = plan_pricing.requires_payment;
    }
    if (selectedPlan !== null && plan_pricing) {
      postData.username = username;
      if (plan_pricing.requires_invoice === true) {
        postData.billing_info = JSON.parse(
          JSON.stringify({
            tax_number,
            street,
            city,
            zipcode,
            country,
            name: `${first_name} ${last_name}`,
          }),
        );
      }
    }
    // add phone_number if SMS verification is enabled
    // and no payment is required
    if (
      settings.mobile_phone_verification &&
      postData.requires_payment !== true
    ) {
      postData.phone_number = phone_number;
      postData.username = phone_number;
    }
    const body = JSON.parse(JSON.stringify(postData));
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/json",
        "accept-language": getLanguageHeaders(language),
      },
      url,
      data: body,
    })
      .then(() => {
        this.setState({
          errors: {},
          phone_number: "",
          email: "",
          password1: "",
          password2: "",
          success: true,
        });
        toast.success(t`REGISTER_SUCCESS`, {
          toastId: mainToastId,
        });
        // will redirect to status which will validate data again
        // and initiate any verification if needed
        authenticate(true);
      })
      .catch((error) => {
        const {data} = error.response;
        if ("billing_info" in data) {
          Object.keys(data.billing_info).forEach((key) => {
            data[key] = data.billing_info[key];
          });
        }
        const errorText = getErrorText(error, t`REGISTER_ERR`);
        logError(error, errorText);
        setLoading(false);
        toast.error(errorText);
        this.setState({
          errors: {
            ...errors,
            ...(data.phone_number ? {phone_number: data.phone_number} : null),
            ...(data.email ? {email: data.email.toString()} : {email: ""}),
            ...(data.username
              ? {username: data.username.toString()}
              : {username: ""}),
            ...(data.first_name
              ? {first_name: data.first_name.toString()}
              : {first_name: ""}),
            ...(data.last_name
              ? {last_name: data.last_name.toString()}
              : {last_name: ""}),
            ...(data.birth_date
              ? {birth_date: data.birth_date.toString()}
              : {birth_date: ""}),
            ...(data.location
              ? {location: data.location.toString()}
              : {location: ""}),
            ...(data.tax_number
              ? {tax_number: data.tax_number.toString()}
              : {tax_number: ""}),
            ...(data.street ? {street: data.street.toString()} : {street: ""}),
            ...(data.city ? {city: data.city.toString()} : {city: ""}),
            ...(data.zipcode
              ? {zipcode: data.zipcode.toString()}
              : {zipcode: ""}),
            ...(data.country
              ? {country: data.country.toString()}
              : {country: ""}),
            ...(data.password1
              ? {password1: data.password1.toString()}
              : {password1: ""}),
            ...(data.password2
              ? {password2: data.password2.toString()}
              : {password2: ""}),
          },
        });
      });
  }

  selectedCountry = (data) => {
    this.setState({countrySelected: data, country: data.value});
  };

  changePlan = (event) => {
    this.setState({selectedPlan: event.target.value});
  };

  getPlan = (plan, index) => {
    /* disable ttag */
    const planTitle = gettext(plan.plan);
    const planDesc = gettext(plan.plan_description);
    const pricingText = Number(plan.price)
      ? `${plan.price} ${plan.currency} ${plan.pricing}`
      : "";
    return (
      <label htmlFor={`radio${index}`}>
        <span className="title">{planTitle}</span>
        <span className="desc">{planDesc}</span>
        {pricingText && <span className="price">{pricingText}</span>}
      </label>
    );
  };

  getPlanSelection = () => {
    const {plans, selectedPlan} = this.state;
    let index = 0;
    return (
      <div className="plans">
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
                onChange={this.changePlan}
                onFocus={this.changePlan}
                tabIndex={currentIndex}
              />
              {this.getPlan(plan, currentIndex)}
            </div>
          );
        })}
      </div>
    );
  };

  isPlanIdentityVerifier = () => {
    // If a payment is required, the plan is valid for identity verification
    const {selectedPlan, plans} = this.state;
    return (
      selectedPlan !== null && plans[selectedPlan].requires_payment === true
    );
  };

  doesPlanRequireInvoice = () => {
    const {settings} = this.props;
    const {selectedPlan, plans} = this.state;
    return (
      settings.subscriptions &&
      selectedPlan !== null &&
      plans[selectedPlan].requires_invoice === true
    );
  };

  getForm = () => {
    const {registration, settings, orgSlug, match} = this.props;
    const {additional_info_text, input_fields, links} = registration;
    const {
      success,
      phone_number,
      email,
      username,
      first_name,
      last_name,
      birth_date,
      location,
      password1,
      password2,
      errors,
      selectedPlan,
      plans,
      tax_number,
      street,
      city,
      zipcode,
      countrySelected,
      hidePassword,
    } = this.state;
    const countries = countryList().getData();
    return (
      <>
        <div className="container content" id="registration">
          <div className="inner">
            <form
              className={`main-column ${success ? "success" : ""}`}
              onSubmit={this.handleSubmit}
              id="registration-form"
            >
              <div className="inner">
                <div className="fieldset">
                  {getError(errors)}
                  {plans.length > 0 && this.getPlanSelection()}
                  {(plans.length === 0 ||
                    (plans.length > 0 && selectedPlan !== null)) && (
                    <>
                      {!this.isPlanIdentityVerifier() &&
                        settings.mobile_phone_verification &&
                        input_fields.phone_number && (
                          <div className="row phone-number">
                            <label htmlFor="phone-number">{t`PHONE_LBL`}</label>
                            {getError(errors, "phone_number")}
                            <Suspense
                              fallback={
                                <input
                                  type="tel"
                                  className="input"
                                  name="phone_number"
                                  value={phone_number}
                                  onChange={(value) =>
                                    this.handleChange({
                                      target: {
                                        name: "phone_number",
                                        value: `+${value}`,
                                      },
                                    })
                                  }
                                  onKeyDown={(event) => {
                                    submitOnEnter(
                                      event,
                                      this,
                                      "registration-form",
                                    );
                                  }}
                                  placeholder={t`PHONE_PHOLD`}
                                />
                              }
                            >
                              <PhoneInput
                                name="phone_number"
                                country={input_fields.phone_number.country}
                                onlyCountries={
                                  input_fields.phone_number.only_countries || []
                                }
                                preferredCountries={
                                  input_fields.phone_number
                                    .preferred_countries || []
                                }
                                excludeCountries={
                                  input_fields.phone_number.exclude_countries ||
                                  []
                                }
                                value={phone_number}
                                onChange={(value) =>
                                  this.handleChange({
                                    target: {
                                      name: "phone_number",
                                      value: `+${value}`,
                                    },
                                  })
                                }
                                onKeyDown={(event) => {
                                  submitOnEnter(
                                    event,
                                    this,
                                    "registration-form",
                                  );
                                }}
                                placeholder={t`PHONE_PHOLD`}
                                enableSearch={Boolean(
                                  input_fields.phone_number.enable_search,
                                )}
                                inputProps={{
                                  name: "phone_number",
                                  id: "phone-number",
                                  className: `form-control input ${
                                    errors.phone_number ? "error" : ""
                                  }`,
                                  required: true,
                                  autoComplete: "tel",
                                }}
                              />
                            </Suspense>
                          </div>
                        )}

                      <div className="row email">
                        <label htmlFor="email">{t`EMAIL`}</label>
                        {getError(errors, "email")}
                        <input
                          className={`input ${errors.email ? "error" : ""}`}
                          type="email"
                          id="email"
                          required
                          name="email"
                          value={email}
                          onChange={this.handleChange}
                          placeholder={t`EMAIL_PHOLD`}
                          pattern={input_fields.email.pattern}
                          autoComplete="email"
                          title={t`EMAIL_PTRN_DESC`}
                        />
                      </div>

                      {this.isPlanIdentityVerifier() && (
                        <div className="row username">
                          <label htmlFor="username">
                            {t`USERNAME_REG_LBL`}
                          </label>
                          {getError(errors, "email")}
                          <input
                            className={`input ${
                              errors.username ? "error" : ""
                            }`}
                            type="text"
                            id="username"
                            required
                            name="username"
                            value={username}
                            onChange={this.handleChange}
                            placeholder={t`USERNAME_REG_PHOLD`}
                            pattern={input_fields.username.pattern}
                            autoComplete="username"
                            title={t`USERNAME_PTRN_DESC`}
                          />
                        </div>
                      )}

                      {(input_fields.first_name.setting !== "disabled" ||
                        this.doesPlanRequireInvoice()) && (
                        <div className="row first_name">
                          <label htmlFor="first_name">
                            {input_fields.first_name.setting === "mandatory"
                              ? t`FIRST_NAME_LBL`
                              : `${t`FIRST_NAME_LBL`} (${t`OPTIONAL`})`}
                          </label>
                          {getError(errors, "first_name")}
                          <input
                            className={`input ${
                              errors.first_name ? "error" : ""
                            }`}
                            type="text"
                            id="first_name"
                            required={
                              input_fields.first_name.setting === "mandatory" ||
                              settings.subscriptions
                            }
                            name="first_name"
                            value={first_name}
                            onChange={this.handleChange}
                            autoComplete="given-name"
                            placeholder={t`FIRST_NAME_PHOLD`}
                          />
                        </div>
                      )}

                      {(input_fields.last_name.setting !== "disabled" ||
                        this.doesPlanRequireInvoice()) && (
                        <div className="row last_name">
                          <label htmlFor="last_name">
                            {input_fields.last_name.setting === "mandatory"
                              ? t`LAST_NAME_LBL`
                              : `${t`LAST_NAME_LBL`} (${t`OPTIONAL`})`}
                          </label>
                          {getError(errors, "last_name")}
                          <input
                            className={`input ${
                              errors.last_name ? "error" : ""
                            }`}
                            type="text"
                            id="last_name"
                            required={
                              input_fields.last_name.setting === "mandatory" ||
                              settings.subscriptions
                            }
                            name="last_name"
                            value={last_name}
                            onChange={this.handleChange}
                            autoComplete="family-name"
                            placeholder={t`LAST_NAME_PHOLD`}
                          />
                        </div>
                      )}

                      {input_fields.birth_date.setting !== "disabled" && (
                        <div className="row birth_date">
                          <label htmlFor="birth_date">
                            {input_fields.birth_date.setting === "mandatory"
                              ? t`BIRTH_DATE_LBL`
                              : `${t`BIRTH_DATE_LBL`} (${t`OPTIONAL`})`}
                          </label>
                          {getError(errors, "birth_date")}
                          <input
                            className={`input ${
                              errors.birth_date ? "error" : ""
                            }`}
                            type="date"
                            id="birth_date"
                            required={
                              input_fields.birth_date.setting === "mandatory"
                            }
                            name="birth_date"
                            value={birth_date}
                            onChange={this.handleChange}
                            autoComplete="bday"
                          />
                        </div>
                      )}

                      {input_fields.location.setting !== "disabled" && (
                        <div className="row location">
                          <label htmlFor="location">
                            {input_fields.location.setting === "mandatory"
                              ? t`LOCATION_LBL`
                              : `${t`LOCATION_LBL`} (${t`OPTIONAL`})`}
                          </label>
                          {getError(errors, "location")}
                          <input
                            className={`input ${
                              errors.location ? "error" : ""
                            }`}
                            type="text"
                            id="location"
                            required={
                              input_fields.location.setting === "mandatory"
                            }
                            name="location"
                            value={location}
                            onChange={this.handleChange}
                            placeholder={t`LOCATION_PHOLD`}
                            pattern={input_fields.location.pattern}
                            autoComplete="street-address"
                            title={t`LOCATION_PTRN_DESC`}
                          />
                        </div>
                      )}

                      <div className="row password">
                        <label htmlFor="password">{t`PWD_LBL`}</label>
                        {getError(errors, "password1")}
                        <input
                          className={`input ${errors.password1 ? "error" : ""}`}
                          type="password"
                          id="password"
                          required
                          name="password1"
                          value={password1}
                          onChange={this.handleChange}
                          placeholder={t`PWD_PHOLD`}
                          pattern={input_fields.password.pattern}
                          title={t`PWD_PTRN_DESC`}
                          ref={this.passwordToggleRef}
                          autoComplete="new-password"
                        />
                        <PasswordToggleIcon
                          inputRef={this.passwordToggleRef}
                          secondInputRef={this.confirmPasswordToggleRef}
                          hidePassword={hidePassword}
                          toggler={() =>
                            this.setState({hidePassword: !hidePassword})
                          }
                        />
                      </div>

                      <div className="row password-confirm">
                        <label htmlFor="password-confirm">
                          {t`CONFIRM_PWD_LBL`}
                        </label>
                        {getError(errors, "password2")}
                        <input
                          className={`input ${errors.password2 ? "error" : ""}`}
                          type="password"
                          id="password-confirm"
                          required
                          name="password2"
                          value={password2}
                          onChange={this.handleChange}
                          placeholder={t`CONFIRM_PWD_PHOLD`}
                          pattern={input_fields.password.pattern}
                          title={t`PWD_PTRN_DESC`}
                          ref={this.confirmPasswordToggleRef}
                          autoComplete="new-password"
                        />
                        <PasswordToggleIcon
                          inputRef={this.confirmPasswordToggleRef}
                          secondInputRef={this.passwordToggleRef}
                          hidePassword={hidePassword}
                          toggler={() =>
                            this.setState({hidePassword: !hidePassword})
                          }
                        />
                      </div>

                      {this.doesPlanRequireInvoice() && (
                        <>
                          <div className="billing-info">
                            <div className="row country">
                              <label htmlFor="country">{t`COUNTRY_LBL`}</label>
                              {getError(errors, "country")}
                              <Select
                                options={countries}
                                value={countrySelected}
                                onChange={this.selectedCountry}
                              />
                            </div>
                            <div className="row city">
                              <label htmlFor="city">{t`CITY_LBL`}</label>
                              {getError(errors, "city")}
                              <input
                                className={`input ${
                                  errors.city ? "error" : ""
                                }`}
                                type="text"
                                id="city"
                                required
                                name="city"
                                value={city}
                                onChange={this.handleChange}
                                autoComplete="address-level2"
                                placeholder={t`CITY_PHOLD`}
                              />
                            </div>
                            <div className="row street">
                              <label htmlFor="street">{t`STREET_LBL`}</label>
                              {getError(errors, "street")}
                              <input
                                className={`input ${
                                  errors.street ? "error" : ""
                                }`}
                                type="text"
                                id="street"
                                required
                                name="street"
                                value={street}
                                onChange={this.handleChange}
                                autoComplete="address"
                                placeholder={t`STREET_PHOLD`}
                              />
                            </div>
                            <div className="row zipcode">
                              <label htmlFor="zipcode">{t`ZIP_CODE_LBL`}</label>
                              {getError(errors, "zipcode")}
                              <input
                                className={`input ${
                                  errors.zipcode ? "error" : ""
                                }`}
                                type="number"
                                id="zipcode"
                                required
                                name="zipcode"
                                value={zipcode}
                                onChange={this.handleChange}
                                autoComplete="postal-code"
                              />
                            </div>
                            <div className="row tax_number">
                              <label htmlFor="tax_number">
                                {t`TAX_NUMBER_LBL`}
                              </label>
                              {getError(errors, "tax_number")}
                              <input
                                className={`input ${
                                  errors.tax_number ? "error" : ""
                                }`}
                                type="text"
                                id="tax_number"
                                name="tax_number"
                                value={tax_number}
                                onChange={this.handleChange}
                                placeholder={t`TAX_NUMBER_PHOLD`}
                                pattern={input_fields.tax_number.pattern}
                                title={t`TAX_NUMBER_PTRN_DESC`}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {(plans.length === 0 ||
                  (plans.length > 0 && selectedPlan !== null)) &&
                  additional_info_text && (
                    <div className="row add-info">
                      {renderAdditionalInfo(
                        t`REGISTER_ADD_INFO_TXT`,
                        orgSlug,
                        "registration",
                      )}
                    </div>
                  )}

                <div className="row register">
                  {(plans.length === 0 ||
                    (plans.length > 0 && selectedPlan !== null)) && (
                    <input
                      type="submit"
                      className="button full"
                      value={t`REGISTER_BTN_TXT`}
                    />
                  )}
                </div>

                {links && (
                  <div className="row links">
                    {links.forget_password && (
                      <p>
                        <Link
                          to={`/${orgSlug}/password/reset`}
                          className="link"
                        >
                          {t`FORGOT_PASSWORD`}
                        </Link>
                      </p>
                    )}
                    {links.login && (
                      <p>
                        <Link to={`/${orgSlug}/login`} className="link">
                          {t`LINKS_LOGIN_TXT`}
                        </Link>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </form>

            <Contact />
          </div>
        </div>
        <Route
          path={`${match.path}/:name`}
          render={(props) => <Modal {...props} prevPath={match.url} />}
        />
      </>
    );
  };

  render() {
    const {settings} = this.props;
    const {plansFetched} = this.state;

    if (settings.subscriptions && !plansFetched) {
      return null;
    }
    return this.getForm();
  }
}
Registration.contextType = LoadingContext;
Registration.propTypes = {
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
    subscriptions: PropTypes.bool,
  }).isRequired,
  registration: PropTypes.shape({
    input_fields: PropTypes.shape({
      email: PropTypes.shape({
        pattern: PropTypes.string.isRequired,
      }).isRequired,
      username: PropTypes.shape({
        pattern: PropTypes.string.isRequired,
        label: PropTypes.object,
        placeholder: PropTypes.object,
      }),
      password: PropTypes.shape({
        pattern: PropTypes.string.isRequired,
      }).isRequired,
      password_confirm: PropTypes.shape({
        pattern: PropTypes.string,
      }).isRequired,
      phone_number: PropTypes.shape({
        country: PropTypes.string,
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }),
      first_name: PropTypes.shape({
        setting: PropTypes.string.isRequired,
      }),
      last_name: PropTypes.shape({
        setting: PropTypes.string.isRequired,
      }),
      location: PropTypes.shape({
        setting: PropTypes.string.isRequired,
        pattern: PropTypes.string.isRequired,
      }),
      birth_date: PropTypes.shape({
        setting: PropTypes.string.isRequired,
      }),
      country: PropTypes.shape({
        pattern: PropTypes.string,
      }),
      zipcode: PropTypes.shape({}),
      city: PropTypes.shape({}),
      street: PropTypes.shape({}),
      tax_number: PropTypes.shape({
        pattern: PropTypes.string.isRequired,
      }),
    }),
    additional_info_text: PropTypes.bool,
    links: PropTypes.object,
  }).isRequired,
  language: PropTypes.string.isRequired,
  match: PropTypes.shape({
    path: PropTypes.string,
    url: PropTypes.string,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  privacyPolicy: PropTypes.object.isRequired,
  termsAndConditions: PropTypes.object.isRequired,
  authenticate: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
};
