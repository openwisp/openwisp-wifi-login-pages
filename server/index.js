import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import cookiesMiddleware from "universal-cookie-express";

import routes from "./routes";

const path = require("path");

const app = express();
app.use(compression());
app.use(express.static(path.join(process.cwd(), "dist")));
app.use(cookieParser());
app.use(cookiesMiddleware());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use("/api/v1/:organization/account", routes.account);
app.get("*", function(req, res) {
  res.sendFile(path.join(process.cwd(), "dist", "index.html"));
});
app.listen(3030, () => {
  console.log("Server started on port 3030");
});
