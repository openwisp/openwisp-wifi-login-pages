import express from "express";

import routes from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use("/api/v1/:organization/account/password/reset", routes.passwordReset);
app.get("/", (req, res) => {
	res.send("Hello world");
});

app.listen(3030, () => {
	console.log("Server started on port 3030");
});
