import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import morgan from 'morgan';
import net from "net";
import path from "path";
import cookiesMiddleware from "universal-cookie-express";
import logger from '../config/winston';
import routes from "./routes";

const app = express();
app.use(compression());
app.use(express.static(path.join(process.cwd(), "dist")));
app.use(cookieParser());
app.use(cookiesMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("combined", { stream: logger.stream.write }));

app.use("/api/v1/:organization/account", routes.account);
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "dist", "index.html"));
});

const DEFAULT_PORT = 3030;

// Finds the next free port, starting at the passed port
const nextFreePort = (port, callback) => {
  const server = net.createServer(socket => {
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

app.use((err, req, res, next)  => {
  logger.error(`${req.method} - ${err.message}  - ${req.originalUrl} - ${req.ip}`);
  next(err)
});

// If a port was passed as an argument, use that port
if (process.env.SERVER !== undefined) {
  app.listen(process.env.SERVER, () => {
    // eslint-disable-next-line no-console
    console.log(`Server started on port ${process.env.SERVER}`);
  });
} else {
  // Otherwise, find the next free port starting at the default port
  nextFreePort(DEFAULT_PORT, port => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server started on port ${port}`);
    });
  });
}
