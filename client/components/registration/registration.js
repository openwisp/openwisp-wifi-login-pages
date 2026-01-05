import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import React, {Suspense} from "react";
import Select from "react-select";
import {Link, Route, Routes} from "react-router-dom";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {t} from "ttag";
import "react-phone-input-2/lib/style.css";
import countries from "./countries.json";
import LoadingContext from "../../utils/loading-context";
import PasswordToggleIcon from "../../utils/password-toggle";
import {mainToastId, registerApiUrl} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import submitOnEnter from "../../utils/submit-on-enter";
import renderAdditionalInfo from "../../utils/render-additional-info";
import Contact from "../contact-box";
import Modal from "../modal";
import getError from "../../utils/get-error";
import getLanguageHeaders from "../../utils/get-language-headers";
import redirectToPayment from "../../utils/redirect-to-payment";
import InfoModal from "../../utils/modal";
import getPlanSelection from "../../utils/get-plan-selection";
import getPlans from "../../utils/get-plans";

const PhoneInput = React.lazy(
  () => import(/* webpackChunkName: 'PhoneInput' */ "react-phone-input-2"),
);

export default class Registration extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phoneNumber: "",
      email: "",
      username: "",
      password1: "",
      password2: "",
      firstName: "",
      lastName: "",
      location: "",
      birthDate: "",
      errors: {},
      success: false,
      plans: [],
      plansFetched: false,
      selectedPlan: null,
      taxNumber: "",
      street: "",
      city: "",
      zipcode: "",
      country: "",
      countrySelected: {},
      hidePassword: true,
      modalActive: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.passwordToggleRef = React.createRef();
    this.confirmPasswordToggleRef = React.createRef();
    this.changePlan = this.changePlan.bind(this);
    this.selectedCountry = this.selectedCountry.bind(this);
    this.getPlansSuccessCallback = this.getPlansSuccessCallback.bind(this);
  }

  componentDidMount() {
    const {orgSlug, settings, setTitle, orgName, language} = this.props;
    const {setLoading} = this.context;

    setTitle(t`REGISTRATION_TITL`, orgName);

    if (settings.subscriptions) {
      setLoading(true);
      getPlans(orgSlug, language, this.getPlansSuccessCallback);
    }
    this.autoSelectFirstPlan();
  }

  async componentDidUpdate(prevProps) {
    const {plans} = this.state;
    const {settings, loading} = this.props;
    const {setLoading} = this.context;
    if (
      settings.subscriptions &&
      plans.length === 0 &&
      loading === false &&
      prevProps.loading === true
    ) {
      setLoading(true);
    }
  }

  getPlansSuccessCallback(plans) {
    const {setLoading} = this.context;
    this.setState({plans, plansFetched: true});
    setLoading(false);
  }

  handleChange(event) {
    handleChange(event, this);
  }

  toggleModal = () => {
    const {modalActive} = this.state;
    this.setState({modalActive: !modalActive});
  };

  handleSubmit(event) {
    const {setLoading} = this.context;
    event.preventDefault();
    const {orgSlug, authenticate, settings, language, setUserData, navigate} =
      this.props;
    const {
      phoneNumber,
      email,
      username,
      firstName,
      lastName,
      birthDate,
      location,
      password1,
      password2,
      errors,
      selectedPlan,
      plans,
      taxNumber,
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
      firstName,
      lastName,
      birthDate,
      location,
      password1,
      password2,
    };
    const optionalFields = {
      firstName,
      lastName,
      birthDate,
      location,
    };
    Object.keys(optionalFields).forEach((key) => {
      if (optionalFields[key].length > 0) {
        postData[key] = optionalFields[key];
      }
    });
    let planPricing;
    if (selectedPlan !== null) {
      planPricing = plans[selectedPlan];
      postData.planPricing = planPricing.id;
      postData.requires_payment = planPricing.requires_payment;
    }
    if (selectedPlan !== null && planPricing) {
      postData.username = username;
      if (planPricing.requires_invoice === true) {
        postData.billing_info = JSON.parse(
          JSON.stringify({
            taxNumber,
            street,
            city,
            zipcode,
            country,
            name: `${firstName} ${lastName}`,
          }),
        );
      }
    }
    // add phoneNumber if SMS verification is enabled
    // and no payment is required
    if (
      settings.mobilePhoneVerification &&
      postData.requires_payment !== true
    ) {
      postData.phoneNumber = phoneNumber;
      postData.username = phoneNumber;
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
      .then((res = {}) => {
        if (!res && !res.data) throw new Error();
        const {key: authToken} = res.data;
        setUserData({
          isVerified: false,
          authToken,
          mustLogin: !postData.requires_payment,
        });
        this.setState({
          errors: {},
          phoneNumber: "",
          email: "",
          password1: "",
          password2: "",
          success: true,
        });
        toast.success(t`REGISTER_SUCCESS`, {
          toastId: mainToastId,
        });
        // if requires_payment
        // redirect to payment status component
        if (postData.requires_payment === true) {
          redirectToPayment(orgSlug, navigate);
        }
        // will redirect to status which will validate data again
        // and initiate any verification if needed
        authenticate(true);
      })
      .catch((error) => {
        const {data, status} = error.response;
        if (status === 404) {
          setLoading(false);
          toast.error(t`404_PG_TITL`);
          return;
        }
        if (status === 409) {
          setLoading(false);
          this.toggleModal();
          this.setState({errors: {...errors, ...data}});
          return;
        }
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
            ...(data.phoneNumber ? {phoneNumber: data.phoneNumber} : null),
            ...(data.email ? {email: data.email.toString()} : {email: ""}),
            ...(data.username
              ? {username: data.username.toString()}
              : {username: ""}),
            ...(data.firstName
              ? {firstName: data.firstName.toString()}
              : {firstName: ""}),
            ...(data.lastName
              ? {lastName: data.lastName.toString()}
              : {lastName: ""}),
            ...(data.birthDate
              ? {birthDate: data.birthDate.toString()}
              : {birthDate: ""}),
            ...(data.location
              ? {location: data.location.toString()}
              : {location: ""}),
            ...(data.taxNumber
              ? {taxNumber: data.taxNumber.toString()}
              : {taxNumber: ""}),
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

  autoSelectFirstPlan = () => {
    const {registration} = this.props;
    if (registration.autoSelectFirstPlan) {
      this.changePlan({target: {value: 0}});
    }
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

  handleResponse = (response) => {
    const {orgSlug, navigate} = this.props;
    if (response) {
      toast.info(t`PLEASE_LOGIN`);
      return navigate(`/${orgSlug}/login`);
    }
    return this.toggleModal();
  };

  getForm = () => {
    const {registration, settings, orgSlug, defaultLanguage} = this.props;
    const {additionalInfoText, inputFields, links, autoSelectFirstPlan} =
      registration;
    const {
      success,
      phoneNumber,
      email,
      username,
      firstName,
      lastName,
      birthDate,
      location,
      password1,
      password2,
      errors,
      selectedPlan,
      plans,
      taxNumber,
      street,
      city,
      zipcode,
      countrySelected,
      hidePassword,
    } = this.state;
    return (
      <>
        <div className="container content" id="registration">
          <div className="inner">
            <form
              className={`main-column ${success ? "success" : ""}`}
              onSubmit={this.handleSubmit}
              id="registration-form"
              data-testid="registration-form"
            >
              <div className="inner">
                <div className="fieldset">
                  {getError(errors)}
                  {plans.length > 0 &&
                    getPlanSelection(
                      defaultLanguage,
                      plans,
                      selectedPlan,
                      this.changePlan,
                      this.changePlan,
                      autoSelectFirstPlan,
                    )}
                  {(plans.length === 0 ||
                    (plans.length > 0 && selectedPlan !== null)) && (
                    <>
                      {!this.isPlanIdentityVerifier() &&
                        settings.mobilePhoneVerification &&
                        inputFields.phoneNumber && (
                          <div className="row phone-number">
                            <label htmlFor="phone-number">{t`PHONE_LBL`}</label>
                            {getError(errors, "phoneNumber")}
                            <Suspense
                              fallback={
                                <input
                                  type="tel"
                                  className="input"
                                  name="phoneNumber"
                                  value={phoneNumber}
                                  onChange={(value) =>
                                    this.handleChange({
                                      target: {
                                        name: "phoneNumber",
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
                                name="phoneNumber"
                                country={inputFields.phoneNumber.country}
                                onlyCountries={
                                  inputFields.phoneNumber.only_countries || []
                                }
                                preferredCountries={
                                  inputFields.phoneNumber.preferred_countries ||
                                  []
                                }
                                excludeCountries={
                                  inputFields.phoneNumber.exclude_countries ||
                                  []
                                }
                                value={phoneNumber}
                                onChange={(value) =>
                                  this.handleChange({
                                    target: {
                                      name: "phoneNumber",
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
                                aria-label="Phone Number"
                                enableSearch={Boolean(
                                  inputFields.phoneNumber.enable_search,
                                )}
                                inputProps={{
                                  name: "phoneNumber",
                                  id: "phone-number",
                                  className: `form-control input ${
                                    errors.phoneNumber ? "error" : ""
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
                          pattern={inputFields.email.pattern}
                          autoComplete="email"
                          title={t`EMAIL_PTRN_DESC`}
                        />
                      </div>

                      {this.isPlanIdentityVerifier() && (
                        <div className="row username">
                          <label htmlFor="username">{t`USERNAME_REG_LBL`}</label>
                          {getError(errors, "username")}
                          <input
                            className={`input ${errors.username ? "error" : ""}`}
                            type="text"
                            id="username"
                            required
                            name="username"
                            value={username}
                            onChange={this.handleChange}
                            placeholder={t`USERNAME_REG_PHOLD`}
                            pattern={inputFields.username.pattern}
                            autoComplete="username"
                            title={t`USERNAME_PTRN_DESC`}
                          />
                        </div>
                      )}

                      {(inputFields.firstName.setting !== "disabled" ||
                        this.doesPlanRequireInvoice()) && (
                        <div className="row firstName">
                          <label htmlFor="firstName">
                            {inputFields.firstName.setting === "mandatory"
                              ? t`firstName_LBL`
                              : `${t`firstName_LBL`} (${t`OPTIONAL`})`}
                          </label>
                          {getError(errors, "firstName")}
                          <input
                            className={`input ${errors.firstName ? "error" : ""}`}
                            type="text"
                            id="firstName"
                            required={
                              inputFields.firstName.setting === "mandatory" ||
                              settings.subscriptions
                            }
                            name="firstName"
                            value={firstName}
                            onChange={this.handleChange}
                            autoComplete="given-name"
                            placeholder={t`firstName_PHOLD`}
                          />
                        </div>
                      )}

                      {(inputFields.lastName.setting !== "disabled" ||
                        this.doesPlanRequireInvoice()) && (
                        <div className="row lastName">
                          <label htmlFor="lastName">
                            {inputFields.lastName.setting === "mandatory"
                              ? t`lastName_LBL`
                              : `${t`lastName_LBL`} (${t`OPTIONAL`})`}
                          </label>
                          {getError(errors, "lastName")}
                          <input
                            className={`input ${errors.lastName ? "error" : ""}`}
                            type="text"
                            id="lastName"
                            required={
                              inputFields.lastName.setting === "mandatory" ||
                              settings.subscriptions
                            }
                            name="lastName"
                            value={lastName}
                            onChange={this.handleChange}
                            autoComplete="family-name"
                            placeholder={t`lastName_PHOLD`}
                          />
                        </div>
                      )}

                      {inputFields.birthDate.setting !== "disabled" && (
                        <div className="row birthDate">
                          <label htmlFor="birthDate">
                            {inputFields.birthDate.setting === "mandatory"
                              ? t`birthDate_LBL`
                              : `${t`birthDate_LBL`} (${t`OPTIONAL`})`}
                          </label>
                          {getError(errors, "birthDate")}
                          <input
                            className={`input ${errors.birthDate ? "error" : ""}`}
                            type="date"
                            id="birthDate"
                            required={
                              inputFields.birthDate.setting === "mandatory"
                            }
                            name="birthDate"
                            value={birthDate}
                            onChange={this.handleChange}
                            autoComplete="bday"
                          />
                        </div>
                      )}

                      {inputFields.location.setting !== "disabled" && (
                        <div className="row location">
                          <label htmlFor="location">
                            {inputFields.location.setting === "mandatory"
                              ? t`LOCATION_LBL`
                              : `${t`LOCATION_LBL`} (${t`OPTIONAL`})`}
                          </label>
                          {getError(errors, "location")}
                          <input
                            className={`input ${errors.location ? "error" : ""}`}
                            type="text"
                            id="location"
                            required={
                              inputFields.location.setting === "mandatory"
                            }
                            name="location"
                            value={location}
                            onChange={this.handleChange}
                            placeholder={t`LOCATION_PHOLD`}
                            pattern={inputFields.location.pattern}
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
                          pattern={inputFields.password.pattern}
                          title={t`PWD_PTRN_DESC`}
                          ref={this.passwordToggleRef}
                          autoComplete="new-password"
                          aria-label="Password"
                        />
                        <PasswordToggleIcon
                          inputRef={this.passwordToggleRef}
                          secondInputRef={this.confirmPasswordToggleRef}
                          parentClassName="password-toggle"
                          hidePassword={hidePassword}
                          ariaLabel="Toggle password visibility"
                          toggler={() =>
                            this.setState({hidePassword: !hidePassword})
                          }
                        />
                      </div>

                      <div className="row password-confirm">
                        <label htmlFor="password-confirm">{t`CONFIRM_PWD_LBL`}</label>
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
                          pattern={inputFields.password.pattern}
                          title={t`PWD_PTRN_DESC`}
                          ref={this.confirmPasswordToggleRef}
                          autoComplete="new-password"
                          aria-label="Confirm Password"
                        />
                        <PasswordToggleIcon
                          inputRef={this.confirmPasswordToggleRef}
                          secondInputRef={this.passwordToggleRef}
                          parentClassName="password-toggle"
                          hidePassword={hidePassword}
                          ariaLabel="Toggle confirm password visibility"
                          toggler={() =>
                            this.setState({hidePassword: !hidePassword})
                          }
                        />
                      </div>

                      {this.doesPlanRequireInvoice() && (
                        <div
                          className="billing-info"
                          data-testid="billing-info"
                        >
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
                              className={`input ${errors.city ? "error" : ""}`}
                              type="text"
                              id="city"
                              required
                              name="city"
                              value={city}
                              onChange={this.handleChange}
                              autoComplete="address-level2"
                              placeholder={t`CITY_PHOLD`}
                              aria-label="City"
                            />
                          </div>
                          <div className="row street">
                            <label htmlFor="street">{t`STREET_LBL`}</label>
                            {getError(errors, "street")}
                            <input
                              className={`input ${errors.street ? "error" : ""}`}
                              type="text"
                              id="street"
                              required
                              name="street"
                              value={street}
                              onChange={this.handleChange}
                              autoComplete="address"
                              placeholder={t`STREET_PHOLD`}
                              aria-label="Street"
                            />
                          </div>
                          <div className="row zipcode">
                            <label htmlFor="zipcode">{t`ZIP_CODE_LBL`}</label>
                            {getError(errors, "zipcode")}
                            <input
                              className={`input ${errors.zipcode ? "error" : ""}`}
                              type="number"
                              id="zipcode"
                              required
                              name="zipcode"
                              value={zipcode}
                              onChange={this.handleChange}
                              autoComplete="postal-code"
                              aria-label="Zip Code"
                            />
                          </div>
                          <div className="row taxNumber">
                            <label htmlFor="taxNumber">{t`taxNumber_LBL`}</label>
                            {getError(errors, "taxNumber")}
                            <input
                              className={`input ${errors.taxNumber ? "error" : ""}`}
                              type="text"
                              id="taxNumber"
                              name="taxNumber"
                              value={taxNumber}
                              onChange={this.handleChange}
                              placeholder={t`taxNumber_PHOLD`}
                              pattern={inputFields.taxNumber.pattern}
                              title={t`taxNumber_PTRN_DESC`}
                              aria-label="Tax Number"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {(plans.length === 0 ||
                  (plans.length > 0 && selectedPlan !== null)) &&
                  additionalInfoText && (
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
        <Routes>
          <Route
            path=":name"
            element={<Modal prevPath={`/${orgSlug}/registration`} />}
          />
        </Routes>
      </>
    );
  };

  render() {
    const {settings} = this.props;
    const {plansFetched, modalActive, errors} = this.state;

    if (settings.subscriptions && !plansFetched) {
      return null;
    }
    return (
      <>
        {errors.organizations && (
          <InfoModal
            active={modalActive}
            toggleModal={this.toggleModal}
            handleResponse={this.handleResponse}
            ariaLabel="dialog"
            content={
              <div className="message">
                <p>
                  {errors.organizations.length === 0
                    ? t`NO_ORGS`
                    : t`CONFLICT_ORGS`}
                </p>
                <ul>
                  {errors.organizations.map((org) => (
                    <li key={org.slug} className="org-list">
                      {org.name}
                    </li>
                  ))}
                </ul>
                <p>{t`CONFLICT_SIGNIN`}</p>
              </div>
            }
          />
        )}
        {this.getForm()}
      </>
    );
  }
}
Registration.contextType = LoadingContext;
Registration.propTypes = {
  settings: PropTypes.shape({
    mobilePhoneVerification: PropTypes.bool,
    subscriptions: PropTypes.bool,
  }).isRequired,
  registration: PropTypes.shape({
    inputFields: PropTypes.shape({
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
      phoneNumber: PropTypes.shape({
        country: PropTypes.string,
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }),
      firstName: PropTypes.shape({
        setting: PropTypes.string.isRequired,
      }),
      lastName: PropTypes.shape({
        setting: PropTypes.string.isRequired,
      }),
      location: PropTypes.shape({
        setting: PropTypes.string.isRequired,
        pattern: PropTypes.string.isRequired,
      }),
      birthDate: PropTypes.shape({
        setting: PropTypes.string.isRequired,
      }),
      country: PropTypes.shape({
        pattern: PropTypes.string,
      }),
      zipcode: PropTypes.shape({}),
      city: PropTypes.shape({}),
      street: PropTypes.shape({}),
      taxNumber: PropTypes.shape({
        pattern: PropTypes.string.isRequired,
      }),
    }),
    additionalInfoText: PropTypes.bool,
    links: PropTypes.object,
    autoSelectFirstPlan: PropTypes.bool,
  }).isRequired,
  language: PropTypes.string.isRequired,
  defaultLanguage: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  authenticate: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
  setUserData: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  navigate: PropTypes.func.isRequired,
};
