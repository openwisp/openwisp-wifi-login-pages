import {render} from "@testing-library/react";
import React from "react";
import {Provider} from "react-redux";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {createMemoryHistory} from "history";
import Registration from "./registration";

const mountComponent = (passedProps) => {
  const historyMock = createMemoryHistory();
  const props = {...passedProps};

  const mockedStore = {
    subscribe: () => {},
    dispatch: () => {},
    getState: () => ({
      organization: {
        configuration: {
          ...props.configuration,
          components: {
            ...props.configuration?.components,
            contact_page: props.configuration?.components?.contact_page || {},
          },
        },
      },
      language: props.language,
    }),
  };

  return render(
    <Provider store={mockedStore}>
      <MemoryRouter location={historyMock.location} navigator={historyMock}>
        <Routes>
          <Route path="/*" element={<Registration {...props} />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

export default mountComponent;
