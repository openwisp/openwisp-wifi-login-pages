import { render } from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import './index.css';

window.store = store;
render(
    <Provider store={store}>
        <div>Hello World</div>
    </Provider>,
    document.getElementById('root'),
);
