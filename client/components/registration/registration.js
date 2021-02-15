/* eslint-disable camelcase */

import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import React from "react";
import Select from "react-select";
import {Link, Route} from "react-router-dom";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneInput from "react-phone-input-2";
import countryList from "react-select-country-list";
import "react-phone-input-2/lib/style.css";
import LoadingContext from "../../utils/loading-context";
import PasswordToggleIcon from "../../utils/password-toggle";
import {
  mainToastId,
  passwordConfirmError,
  registerApiUrl,
  plansApiUrl,
  registerError,
  registerSuccess,
} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import getText from "../../utils/get-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import submitOnEnter from "../../utils/submit-on-enter";
import renderAdditionalInfo from "../../utils/render-additional-info";
import Contact from "../contact-box";
import Modal from "../modal";

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
      gotPlans: false,
      selected_plan: null,
      tax_number: "",
      street: "",
      city: "",
      zipcode: "",
      country: "",
      countrySelected: {},
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.passwordToggleRef = React.createRef();
    this.confirmPasswordToggleRef = React.createRef();
    this.choiceFormChange = this.choiceFormChange.bind(this);
    this.selectedCountry = this.selectedCountry.bind(this);
  }

  componentDidMount() {
    const {orgSlug, settings} = this.props;
    const plansUrl = plansApiUrl.replace("{orgSlug}", orgSlug);
    if (settings.subscriptions) {
      axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        url: plansUrl,
      })
        .then((response) => {
          this.setState({plans: response.data, gotPlans: true});
        })
        .catch((error) => {
          console.log(`error ${error}`);
        });
    }
  }

  handleChange(event) {
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    event.preventDefault();
    const {orgSlug, authenticate, settings, setUserData, userData} = this.props;
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
      selected_plan,
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
          password2: passwordConfirmError,
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
    // add phone_number if SMS verification is enabled
    if (settings.mobile_phone_verification) {
      postData.phone_number = phone_number;
      postData.username = phone_number;
    }
    let plan_pricing;
    if (selected_plan !== null) {
      plan_pricing = plans[selected_plan];
      postData.plan_pricing = plan_pricing.id;
    }
    if (
      selected_plan !== null &&
      plan_pricing &&
      plan_pricing.verifies_identity === true
    ) {
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
      postData.username = username;
    }
    const body = JSON.parse(JSON.stringify(postData));
    // TODO: what?
    // window.signUpData = postData;
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/json",
      },
      url,
      data: body,
    })
      .then((response) => {
        this.setState({
          errors: {},
          phone_number: "",
          email: "",
          password1: "",
          password2: "",
          success: true,
        });

        // TODO: review this whole block!

        // SMS verification flow
        if (
          // redundant
          (settings.mobile_phone_verification && !settings.subscriptions) ||
          (settings.mobile_phone_verification && !plan_pricing) ||
          (settings.mobile_phone_verification &&
            !plan_pricing.verifies_identity)
        ) {
          setUserData({...userData, is_active: true, is_verified: false});
          // simple sign up flow
        } else if (
          settings.subscriptions &&
          plan_pricing &&
          plan_pricing.verifies_identity
        ) {
          authenticate(true);
          window.location.assign(response.data.payment_url);
          return;
        } else {
          setUserData({...userData, is_active: true});

          // TODO: is this toast message being shown only during simple email based registration?

          toast.success(registerSuccess, {
            toastId: mainToastId,
          });
        }
        authenticate(true);
        setLoading(false);
      })
      .catch((error) => {
        const {data} = error.response;
        if ("billing_info" in data) {
          Object.keys(data.billing_info).forEach((key) => {
            data[key] = data.billing_info[key];
          });
        }
        const errorText = getErrorText(error, registerError);
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

  getLabel = (field) => {
    const {language, settings} = this.props;
    return field.setting === "mandatory" || settings.subscriptions
      ? getText(field.label, language)
      : getText(field.label_optional, language);
  };

  selectedCountry = (data) => {
    this.setState({countrySelected: data, country: data.value});
  };

  choiceFormChange = (event) => {
    this.setState({selected_plan: event.target.value});
  };

  getLabelText = (selection) => {
    const {plans} = this.state;
    const plan = plans[selection];
    return `${plan.plan}. ${plan.plan_description} ${plan.pricing} ${plan.price} ${plan.currency}`;
  };

  getChoiceForm = () => {
    const {registration, language} = this.props;
    const {plans_setting} = registration;
    return (
      <div>
        <p style={{textAlign: "center"}}>
          {getText(plans_setting.text, language)}
        </p>
        <div>
          <input
            id="radio0"
            type="radio"
            value={0}
            name="plan_selection"
            onChange={this.choiceFormChange}
          />
          <label htmlFor="radio0">{this.getLabelText(0)}</label>
        </div>
        <div>
          <input
            id="radio1"
            type="radio"
            value={1}
            name="plan_selection"
            onChange={this.choiceFormChange}
          />
          <label htmlFor="radio1">{this.getLabelText(1)}</label>
        </div>
        <div>
          <input
            id="radio3"
            type="radio"
            value={2}
            name="plan_selection"
            onChange={this.choiceFormChange}
          />
          <label htmlFor="radio3">{this.getLabelText(2)}</label>
        </div>
      </div>
    );
  };

  isPlanIdentityVerifier = () => {
    const {selected_plan, plans} = this.state;
    return (
      selected_plan !== null && plans[selected_plan].verifies_identity === true
    );
  };

  getForm = () => {
    const {settings} = this.props;
    const {gotPlans} = this.state;

    if (settings.subscriptions && !gotPlans) {
      return (
        <div className="loadContainer">
          <p className="load" />
        </div>
      );
    }
    return this.getRegistrationForm();
  };

  getRegistrationForm = () => {
    const {
      registration,
      settings,
      language,
      termsAndConditions,
      privacyPolicy,
      orgSlug,
      match,
    } = this.props;
    const {buttons, additional_info_text, input_fields, links} = registration;
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
      selected_plan,
      plans,
      tax_number,
      street,
      city,
      zipcode,
      countrySelected,
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
              <div className="fieldset">
                {errors.nonField && (
                  <div className="error non-field">
                    <span className="icon">!</span>
                    <span className="text">{errors.nonField}</span>
                  </div>
                )}
                {plans.length > 0 && this.getChoiceForm()}
                {(plans.length === 0 ||
                  (plans.length > 0 && selected_plan !== null)) && (
                  <>
                    {!this.isPlanIdentityVerifier() &&
                      settings.mobile_phone_verification &&
                      input_fields.phone_number && (
                        <div className="row phone-number">
                          <label htmlFor="phone-number">
                            {getText(input_fields.phone_number.label, language)}
                          </label>

                          {errors.phone_number && (
                            <div className="error">
                              <span className="icon">!</span>
                              <span className="text">
                                {errors.phone_number}
                              </span>
                            </div>
                          )}
                          <PhoneInput
                            name="phone_number"
                            country={input_fields.phone_number.country}
                            onlyCountries={
                              input_fields.phone_number.only_countries || []
                            }
                            preferredCountries={
                              input_fields.phone_number.preferred_countries ||
                              []
                            }
                            excludeCountries={
                              input_fields.phone_number.exclude_countries || []
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
                              submitOnEnter(event, this, "registration-form");
                            }}
                            placeholder={getText(
                              input_fields.phone_number.placeholder,
                              language,
                            )}
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
                            }}
                          />
                        </div>
                      )}

                    <div className="row email">
                      <label htmlFor="email">
                        {getText(input_fields.email.label, language)}
                      </label>
                      {errors.email && (
                        <div className="error email">
                          <span className="icon">!</span>
                          <span className="text text-email">
                            {errors.email}
                          </span>
                        </div>
                      )}
                      <input
                        className={`input ${errors.email ? "error" : ""}`}
                        type={input_fields.email.type}
                        id="email"
                        required
                        name="email"
                        value={email}
                        onChange={this.handleChange}
                        placeholder={getText(
                          input_fields.email.placeholder,
                          language,
                        )}
                        pattern={input_fields.email.pattern}
                        title={getText(
                          input_fields.email.pattern_description,
                          language,
                        )}
                      />
                    </div>

                    {this.isPlanIdentityVerifier() && (
                      <div className="row username">
                        <label htmlFor="username">
                          {getText(input_fields.username.label, language)}
                        </label>
                        {errors.email && (
                          <div className="error username">
                            <span className="icon">!</span>
                            <span className="text text-username">
                              {errors.username}
                            </span>
                          </div>
                        )}
                        <input
                          className={`input ${errors.username ? "error" : ""}`}
                          type={input_fields.username.type}
                          id="username"
                          required
                          name="username"
                          value={username}
                          onChange={this.handleChange}
                          placeholder={getText(
                            input_fields.username.placeholder,
                            language,
                          )}
                          pattern={input_fields.username.pattern}
                          title={getText(
                            input_fields.username.pattern_description,
                            language,
                          )}
                        />
                      </div>
                    )}

                    {(input_fields.first_name.setting !== "disabled" ||
                      (this.isPlanIdentityVerifier() &&
                        settings.subscriptions)) && (
                      <div className="row first_name">
                        <label htmlFor="first_name">
                          {this.getLabel(input_fields.first_name)}
                        </label>
                        {errors.first_name && (
                          <div className="error first_name">
                            <span className="icon">!</span>
                            <span className="text text-first_name">
                              {errors.first_name}
                            </span>
                          </div>
                        )}
                        <input
                          className={`input ${
                            errors.first_name ? "error" : ""
                          }`}
                          type={input_fields.first_name.type}
                          id="first_name"
                          required={
                            input_fields.first_name.setting === "mandatory" ||
                            settings.subscriptions
                          }
                          name="first_name"
                          value={first_name}
                          onChange={this.handleChange}
                          placeholder={getText(
                            input_fields.first_name.placeholder,
                            language,
                          )}
                          pattern={input_fields.first_name.pattern}
                          title={getText(
                            input_fields.first_name.pattern_description,
                            language,
                          )}
                        />
                      </div>
                    )}

                    {(input_fields.last_name.setting !== "disabled" ||
                      (this.isPlanIdentityVerifier() &&
                        settings.subscriptions)) && (
                      <div className="row last_name">
                        <label htmlFor="last_name">
                          {this.getLabel(input_fields.last_name)}
                        </label>
                        {errors.last_name && (
                          <div className="error last_name">
                            <span className="icon">!</span>
                            <span className="text text-last_name">
                              {errors.last_name}
                            </span>
                          </div>
                        )}
                        <input
                          className={`input ${errors.last_name ? "error" : ""}`}
                          type={input_fields.last_name.type}
                          id="last_name"
                          required={
                            input_fields.last_name.setting === "mandatory" ||
                            settings.subscriptions
                          }
                          name="last_name"
                          value={last_name}
                          onChange={this.handleChange}
                          placeholder={getText(
                            input_fields.last_name.placeholder,
                            language,
                          )}
                          pattern={input_fields.last_name.pattern}
                          title={getText(
                            input_fields.last_name.pattern_description,
                            language,
                          )}
                        />
                      </div>
                    )}

                    {input_fields.birth_date.setting !== "disabled" && (
                      <div className="row birth_date">
                        <label htmlFor="birth_date">
                          {this.getLabel(input_fields.birth_date)}
                        </label>
                        {errors.birth_date && (
                          <div className="error birth_date">
                            <span className="icon">!</span>
                            <span className="text text-birth_date">
                              {errors.birth_date}
                            </span>
                          </div>
                        )}
                        <input
                          className={`input ${
                            errors.birth_date ? "error" : ""
                          }`}
                          type={input_fields.birth_date.type}
                          id="birth_date"
                          required={
                            input_fields.birth_date.setting === "mandatory"
                          }
                          name="birth_date"
                          value={birth_date}
                          onChange={this.handleChange}
                        />
                      </div>
                    )}

                    {input_fields.location.setting !== "disabled" && (
                      <div className="row location">
                        <label htmlFor="location">
                          {this.getLabel(input_fields.location)}
                        </label>
                        {errors.location && (
                          <div className="error location">
                            <span className="icon">!</span>
                            <span className="text text-location">
                              {errors.location}
                            </span>
                          </div>
                        )}
                        <input
                          className={`input ${errors.location ? "error" : ""}`}
                          type={input_fields.location.type}
                          id="location"
                          required={
                            input_fields.location.setting === "mandatory"
                          }
                          name="location"
                          value={location}
                          onChange={this.handleChange}
                          placeholder={getText(
                            input_fields.location.placeholder,
                            language,
                          )}
                          pattern={input_fields.location.pattern}
                          title={getText(
                            input_fields.location.pattern_description,
                            language,
                          )}
                        />
                      </div>
                    )}

                    <div className="row password">
                      <label htmlFor="password">
                        {getText(input_fields.password.label, language)}
                      </label>
                      {errors.password1 && (
                        <div className="error">
                          <span className="icon">!</span>
                          <span className="text">{errors.password1}</span>
                        </div>
                      )}
                      <input
                        className={`input ${errors.password1 ? "error" : ""}`}
                        type={input_fields.password.type}
                        id="password"
                        required
                        name="password1"
                        value={password1}
                        onChange={this.handleChange}
                        placeholder={getText(
                          input_fields.password.placeholder,
                          language,
                        )}
                        pattern={input_fields.password.pattern}
                        title={getText(
                          input_fields.password.pattern_description,
                        )}
                        ref={this.passwordToggleRef}
                      />
                      <PasswordToggleIcon
                        inputRef={this.passwordToggleRef}
                        language={language}
                        orgSlug={orgSlug}
                      />
                    </div>

                    <div className="row password-confirm">
                      <label htmlFor="password-confirm">
                        {getText(input_fields.password_confirm.label, language)}
                      </label>
                      {errors.password2 && (
                        <div className="error confirm">
                          <span className="icon">!</span>
                          <span className="text text-confirm">
                            {errors.password2}
                          </span>
                        </div>
                      )}
                      <input
                        className={`input ${errors.password2 ? "error" : ""}`}
                        type={input_fields.password_confirm.type}
                        id="password-confirm"
                        required
                        name="password2"
                        value={password2}
                        onChange={this.handleChange}
                        placeholder={getText(
                          input_fields.password_confirm.placeholder,
                          language,
                        )}
                        pattern={input_fields.password.pattern}
                        title={getText(
                          input_fields.password.pattern_description,
                          language,
                        )}
                        ref={this.confirmPasswordToggleRef}
                      />
                      <PasswordToggleIcon
                        inputRef={this.confirmPasswordToggleRef}
                        language={language}
                        orgSlug={orgSlug}
                      />
                    </div>

                    {this.isPlanIdentityVerifier() && (
                      <>
                        <div className="billing-info">
                          <div className="row country">
                            <label htmlFor="country">
                              {getText(input_fields.country.label, language)}
                            </label>
                            {errors.country && (
                              <div className="error country">
                                <span className="icon">!</span>
                                <span className="text text-country">
                                  {errors.country}
                                </span>
                              </div>
                            )}
                            <Select
                              options={countries}
                              value={countrySelected}
                              onChange={this.selectedCountry}
                            />
                          </div>
                          <div className="row city">
                            <label htmlFor="city">
                              {getText(input_fields.city.label, language)}
                            </label>
                            {errors.city && (
                              <div className="error city">
                                <span className="icon">!</span>
                                <span className="text text-city">
                                  {errors.city}
                                </span>
                              </div>
                            )}
                            <input
                              className={`input ${errors.city ? "error" : ""}`}
                              type={input_fields.city.type}
                              id="city"
                              required
                              name="city"
                              value={city}
                              onChange={this.handleChange}
                              placeholder={getText(
                                input_fields.city.placeholder,
                                language,
                              )}
                            />
                          </div>
                          <div className="row street">
                            <label htmlFor="street">
                              {getText(input_fields.street.label, language)}
                            </label>
                            {errors.street && (
                              <div className="error street">
                                <span className="icon">!</span>
                                <span className="text text-street">
                                  {errors.street}
                                </span>
                              </div>
                            )}
                            <input
                              className={`input ${
                                errors.street ? "error" : ""
                              }`}
                              type={input_fields.street.type}
                              id="street"
                              required
                              name="street"
                              value={street}
                              onChange={this.handleChange}
                              placeholder={getText(
                                input_fields.street.placeholder,
                                language,
                              )}
                            />
                          </div>
                          <div className="row zipcode">
                            <label htmlFor="zipcode">
                              {getText(input_fields.zipcode.label, language)}
                            </label>
                            {errors.zipcode && (
                              <div className="error zipcode">
                                <span className="icon">!</span>
                                <span className="text text-zipcode">
                                  {errors.zipcode}
                                </span>
                              </div>
                            )}
                            <input
                              className={`input ${
                                errors.zipcode ? "error" : ""
                              }`}
                              type={input_fields.zipcode.type}
                              id="zipcode"
                              required
                              name="zipcode"
                              value={zipcode}
                              onChange={this.handleChange}
                            />
                          </div>
                          <div className="row tax_number">
                            <label htmlFor="tax_number">
                              {getText(input_fields.tax_number.label, language)}
                            </label>
                            {errors.tax_number && (
                              <div className="error tax_number">
                                <span className="icon">!</span>
                                <span className="text text-tax_number">
                                  {errors.tax_number}
                                </span>
                              </div>
                            )}
                            <input
                              className={`input ${
                                errors.tax_number ? "error" : ""
                              }`}
                              type={input_fields.tax_number.type}
                              id="tax_number"
                              name="tax_number"
                              value={tax_number}
                              onChange={this.handleChange}
                              placeholder={getText(
                                input_fields.tax_number.placeholder,
                                language,
                              )}
                              pattern={input_fields.tax_number.pattern}
                              title={getText(
                                input_fields.tax_number.pattern_description,
                                language,
                              )}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {(plans.length === 0 ||
                (plans.length > 0 && selected_plan !== null)) &&
                additional_info_text && (
                  <div className="row add-info">
                    {renderAdditionalInfo(
                      additional_info_text,
                      language,
                      termsAndConditions,
                      privacyPolicy,
                      orgSlug,
                      "registration",
                    )}
                  </div>
                )}

              <div className="row register">
                {(plans.length === 0 ||
                  (plans.length > 0 && selected_plan !== null)) && (
                  <input
                    type="submit"
                    className="button full"
                    value={getText(buttons.register.text, language)}
                  />
                )}
              </div>

              {links && (
                <div className="row links">
                  {links.forget_password && (
                    <p>
                      <Link to={`/${orgSlug}/password/reset`} className="link">
                        {getText(links.forget_password, language)}
                      </Link>
                    </p>
                  )}
                  {links.login && (
                    <p>
                      <Link to={`/${orgSlug}/login`} className="link">
                        {getText(links.login, language)}
                      </Link>
                    </p>
                  )}
                </div>
              )}
            </form>

            <Contact />
          </div>
        </div>
        <Route
          path={`${match.path}/:name`}
          render={(props) => {
            return <Modal {...props} prevPath={match.url} />;
          }}
        />
      </>
    );
  };

  render() {
    return <>{this.getForm()}</>;
  }
}
Registration.contextType = LoadingContext;
Registration.propTypes = {
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
    subscriptions: PropTypes.bool,
  }).isRequired,
  registration: PropTypes.shape({
    header: PropTypes.object,
    buttons: PropTypes.shape({
      register: PropTypes.shape({
        text: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
    input_fields: PropTypes.shape({
      email: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }).isRequired,
      username: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }),
      password: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }).isRequired,
      password_confirm: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
      }).isRequired,
      phone_number: PropTypes.shape({
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
        country: PropTypes.string,
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }),
      first_name: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        label_optional: PropTypes.object.isRequired,
        setting: PropTypes.string.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }),
      last_name: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        label_optional: PropTypes.object.isRequired,
        setting: PropTypes.string.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }),
      location: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        label_optional: PropTypes.object.isRequired,
        setting: PropTypes.string.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }),
      birth_date: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        label_optional: PropTypes.object.isRequired,
        setting: PropTypes.string.isRequired,
      }),
      country: PropTypes.shape({
        label: PropTypes.object.isRequired,
      }),
      zipcode: PropTypes.shape({
        label: PropTypes.object.isRequired,
        type: PropTypes.string.isRequired,
      }),
      city: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
      }),
      street: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
      }),
      tax_number: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }),
    }),
    additional_info_text: PropTypes.object,
    links: PropTypes.object,
    plans_setting: PropTypes.shape({
      text: PropTypes.object.isRequired,
    }),
  }).isRequired,
  language: PropTypes.string.isRequired,
  match: PropTypes.shape({
    path: PropTypes.string,
    url: PropTypes.string,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  privacyPolicy: PropTypes.shape({
    title: PropTypes.object,
    content: PropTypes.object,
  }).isRequired,
  termsAndConditions: PropTypes.shape({
    title: PropTypes.object,
    content: PropTypes.object,
  }).isRequired,
  authenticate: PropTypes.func.isRequired,
  setUserData: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
};
