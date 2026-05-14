import React from "react";
import PropTypes from "prop-types";
import {MemoryRouter} from "react-router-dom";

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

// Removed unused JSDoc stubs for render helpers; file now only
// provides `TestRouter` and `routerFutureFlags` for tests.

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

TestRouter.propTypes = {
  children: PropTypes.node,
  initialEntries: PropTypes.arrayOf(PropTypes.string),
};

TestRouter.defaultProps = {
  children: null,
  initialEntries: ["/"],
};

/**
 * Export the router future flags for tests that need direct access
 */
export {routerFutureFlags};
