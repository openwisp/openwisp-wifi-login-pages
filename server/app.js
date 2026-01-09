import compression from "compression";
import cookieParser from "cookie-parser";
import cookiesMiddleware from "universal-cookie-express";
import express from "express";
import path from "path";
import routes from "./routes";
import morganMiddleware from "./morganMiddleware";

const app = express();
app.use(compression());
app.use(morganMiddleware);
app.use(express.static(path.join(process.cwd(), "dist")));
app.use(cookieParser());
app.use(cookiesMiddleware());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
const prefix = "/api/v1/:organization";
app.use(`${prefix}/account`, routes.account);
app.use(`${prefix}/modal`, routes.modal);
app.use(`${prefix}/plan`, routes.plans);
app.use(`${prefix}/payment`, routes.payment);
app.get("/*splat", (req, res) => {
  res.sendFile(path.join(process.cwd(), "dist", "index.html"));
});

export default app;
