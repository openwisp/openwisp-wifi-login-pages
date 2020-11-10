const submitOnEnter = (event, instance, elementId) => {
  if (event.keyCode === 13) {
    const form = document.getElementById(elementId);
    if (form.reportValidity && form.reportValidity()) {
      instance.handleSubmit(event);
    }
  }
};
export default submitOnEnter;
