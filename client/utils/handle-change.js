const handleChange = (event, instance) => {
  instance.setState({
    [event.target.name]: event.target.value,
  });
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
