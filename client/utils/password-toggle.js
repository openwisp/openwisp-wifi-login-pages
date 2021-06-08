import React from "react";
import propTypes from "prop-types";
import getConfig from "./get-config";
import getText from "./get-text";

class PasswordToggleIcon extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: false,
    };
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    const {isVisible} = this.props;
    this.setState({
      isVisible,
    });
  }

  handleClick(inputRef) {
    const {isVisible} = this.state;
    this.setState(
      {
        isVisible: !isVisible,
      },
      () => {
        inputRef.current.setAttribute(
          "type",
          inputRef.current.getAttribute("type") === "password"
            ? "text"
            : "password",
        );
      },
    );
  }

  render() {
    const {inputRef, parentClassName, language, orgSlug} = this.props;
    const config = getConfig(orgSlug);
    const passwordIcon = config.password_eye_icon;
    const showPasswordIcon = () => (
      <i className="eye" title={getText(passwordIcon.reveal.title, language)} />
    );
    const hidePasswordIcon = () => (
      <i
        className="eye-slash"
        title={getText(passwordIcon.hide.title, language)}
      />
    );
    const {isVisible} = this.state;
    const hideVal = showPasswordIcon();
    const showVal = hidePasswordIcon();
    return (
      <div
        className={parentClassName}
        onClick={() => this.handleClick(inputRef)}
        role="button"
        tabIndex={0}
        onKeyDown={() => {}}
      >
        {!isVisible ? hideVal : showVal}
      </div>
    );
  }
}

export default PasswordToggleIcon;

PasswordToggleIcon.defaultProps = {
  parentClassName: "",
  isVisible: false,
};

PasswordToggleIcon.propTypes = {
  inputRef: propTypes.object.isRequired,
  parentClassName: propTypes.string,
  isVisible: propTypes.bool,
  language: propTypes.string.isRequired,
  orgSlug: propTypes.string.isRequired,
};
