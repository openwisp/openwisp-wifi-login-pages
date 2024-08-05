import axios from "axios";

const {REACT_APP_SERVER_URL} = process.env;

const instance = axios.create({
  baseURL: `${REACT_APP_SERVER_URL}`,
});

export default instance;
