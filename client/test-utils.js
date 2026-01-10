import React from "react";
import {render} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {Provider} from "react-redux";

/**
 * Shared MemoryRouter configuration with React Router v7 future flags
 * These flags enable v7 behavior in v6 for smoother migration:
 * - v7_startTransition: Wraps state updates in React.startTransition for better performance
 * - v7_relativeSplatPath: Fixes relative path resolution in splat routes
 */
const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

/**
 * Renders a component wrapped with MemoryRouter and v7 future flags
 * @param {React.ReactElement} component - Component to render
 * @param {Object} options - Render options
 * @param {string[]} options.initialEntries - Initial router entries (default: ["/"])
 * @param {Object} options.routerProps - Additional props for MemoryRouter
 * @returns {Object} - Render result from @testing-library/react
 */
export function renderWithRouter(component, options = {}) {
  const {initialEntries = ["/"], routerProps = {}} = options;

  return render(
    <MemoryRouter
      initialEntries={initialEntries}
      future={routerFutureFlags}
      {...routerProps}
    >
      {component}
    </MemoryRouter>,
  );
}

/**
 * Renders a component wrapped with Redux Provider and MemoryRouter with v7 future flags
 * @param {React.ReactElement} component - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.store - Redux store (required)
 * @param {string[]} options.initialEntries - Initial router entries (default: ["/"])
 * @param {Object} options.routerProps - Additional props for MemoryRouter
 * @returns {Object} - Render result from @testing-library/react
 */
export function renderWithRouterAndStore(component, options = {}) {
  const {store, initialEntries = ["/"], routerProps = {}} = options;

  if (!store) {
    throw new Error("store is required for renderWithRouterAndStore");
  }

  return render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={initialEntries}
        future={routerFutureFlags}
        {...routerProps}
      >
        {component}
      </MemoryRouter>
    </Provider>,
  );
}

/**
 * TestRouter component that wraps children with MemoryRouter and v7 future flags
 * Useful for wrapping components in test setup or describe blocks
 */
export function TestRouter({children, initialEntries = ["/"], ...props}) {
  return (
    <MemoryRouter
      initialEntries={initialEntries}
      future={routerFutureFlags}
      {...props}
    >
      {children}
    </MemoryRouter>
  );
}

/**
 * Export the router future flags for tests that need direct access
 */
export {routerFutureFlags};
