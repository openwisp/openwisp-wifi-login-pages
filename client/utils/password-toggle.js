import React from "react";
import propTypes from "prop-types";
import {t} from "ttag";

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
    const {inputRef, parentClassName} = this.props;
    const showPasswordIcon = () => <i className="eye" title={t`PWD_REVEAL`} />;
    const hidePasswordIcon = () => (
      <i className="eye-slash" title={t`PWD_HIDE`} />
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
};
