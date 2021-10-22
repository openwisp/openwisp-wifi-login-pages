import compression from "compression";
import cookieParser from "cookie-parser";
import cookiesMiddleware from "universal-cookie-express";
import express from "express";
import net from "net";
import path from "path";
import routes from "./routes";
import morganMiddleware from "./morganMiddleware";
import Logger from "./utils/logger";

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
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "dist", "index.html"));
});

const DEFAULT_PORT = 3030;

// Finds the next free port, starting at the passed port
const nextFreePort = (port, callback) => {
  const server = net.createServer((socket) => {
    socket.write("Testing socket..\r\n");
    socket.pipe(socket);
  });

  // If port is already in use, try next port
  server.listen(port, "127.0.0.1");
  server.on("error", () => {
    nextFreePort(port + 1, callback);
  });

  // If port is available, pass port to callback
  server.on("listening", () => {
    server.close();
    callback(port);
  });
};

// If a port was passed as an argument, use that port
if (process.env.SERVER !== undefined) {
  app.listen(process.env.SERVER, () => {
    Logger.info(`Server started on port ${process.env.SERVER}`);
  });
} else {
  // Otherwise, find the next free port starting at the default port
  nextFreePort(DEFAULT_PORT, (port) => {
    app.listen(port, () => {
      Logger.info(`Server started on port ${port}`);
    });
  });
}
