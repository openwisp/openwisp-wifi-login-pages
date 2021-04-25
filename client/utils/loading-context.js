import React from "react";

export const loadingContextValue = {setLoading: () => {}, getLoading: () => {}};
const LoadingContext = React.createContext(loadingContextValue);

export default LoadingContext;
