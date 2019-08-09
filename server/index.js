import cookieParser from "cookie-parser";
import express from "express";

import routes from "./routes";

const app = express();
const cookiesMiddleware = require("universal-cookie-express");

app.use(cookieParser());
app.use(cookiesMiddleware());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use("/api/v1/:organization/account", routes.account);

app.listen(3030, () => {
  console.log("Server started on port 3030");
});
