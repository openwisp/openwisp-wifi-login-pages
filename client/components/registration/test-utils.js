import {mount} from "enzyme";
import React from "react";
import {Provider} from "react-redux";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
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
        <Routes>
          <Route path="/*" element={<Registration {...props} />} />
        </Routes>
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
