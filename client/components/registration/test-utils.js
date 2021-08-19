import {mount} from "enzyme";
import React from "react";
import {Provider} from "react-redux";
import {Router} from "react-router-dom";
import PropTypes from "prop-types";
import {createMemoryHistory} from "history";
import Registration from "./registration";
import {loadingContextValue} from "../../utils/loading-context";

const mountComponent = async (passedProps) => {
  const historyMock = createMemoryHistory();
  const props = {...passedProps};

  Registration.contextTypes = undefined;
  const mockedStore = {
    subscribe: () => {},
    dispatch: () => {},
    // needed to render <Contact/>
    getState: () => ({
      organization: {
        configuration: props.configuration,
      },
      language: props.language,
    }),
  };

  return mount(
    <Provider store={mockedStore}>
      <Router history={historyMock}>
        <Registration {...props} />
      </Router>
    </Provider>,
    {
      context: {
        store: mockedStore,
        ...loadingContextValue,
      },
      childContextTypes: {
        store: PropTypes.object.isRequired,
        setLoading: PropTypes.func,
        getLoading: PropTypes.func,
      },
    },
  );
};

export default mountComponent;
