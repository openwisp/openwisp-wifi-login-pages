const handleChange = (event, instance) => {
  const {name} = event.target;
  if (name === "email") {
    const emailValue = event.target.value;
    const username = emailValue.substring(0, emailValue.indexOf("@"));
    instance.setState({
      email: emailValue,
      username,
    });
  } else {
    instance.setState({
      [event.target.name]: event.target.value,
    });
  }
  // clean errors
  const {errors} = instance.state;
  if (errors[event.target.name]) {
    delete errors[event.target.name];
  }
  if (errors.nonField) {
    delete errors.nonField;
  }
};

export default handleChange;
