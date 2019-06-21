import axios from "axios";
import cookie from "cookie-signature";
import merge from "deepmerge";
import qs from "qs";

import config from "../config.json";
import defaultConfig from "../utils/default-config";

const obtainToken = (req, res) => {
	const reqOrg = req.params.organization;
	const validSlug = config.some(org => {
		if (org.slug === reqOrg) {
			// merge default config and custom config
			const conf = merge(defaultConfig, org);
			const {host} = conf;
			let obtainTokenUrl = conf.proxy_urls.user_auth_token;
			// replacing org_slug param with the slug
			obtainTokenUrl = obtainTokenUrl.replace("{org_slug}", org.slug);
			const timeout = conf.timeout * 1000;
			const {username, password} = req.body;
			// make AJAX request
			axios({
				method: "post",
				headers: {"content-type": "application/x-www-form-urlencoded"},
				url: `${host}${obtainTokenUrl}/`,
				timeout,
				data: qs.stringify({username, password}),
			})
				.then(response => {
					// save token in signed cookie
					const radTokenCookie = cookie.sign(
						response.data.radius_user_token,
						conf.secret_key,
					);
					const authTokenCookie = cookie.sign(
						response.data.key,
						conf.secret_key,
					);
					// forward response
					res
						.status(response.status)
						.type("application/json")
						.cookie(`${conf.slug}_radius_user_token`, radTokenCookie, {
							maxAge: 1000 * 60 * 60 * 24,
						})
						.cookie(`${conf.slug}_auth_token`, authTokenCookie, {
							maxAge: 1000 * 60 * 60 * 24,
						})
						.send(response.data);
				})
				.catch(error => {
					// forward error
					try {
						res
							.status(error.response.status)
							.type("application/json")
							.send(error.response.data);
					} catch (err) {
						res
							.status(500)
							.type("application/json")
							.send({
								detail: "Internal server error",
							});
					}
				});
		}
		return org.slug === reqOrg;
	});
	// return 404 for invalid organization slug or org not listed in config
	if (!validSlug) {
		res
			.status(404)
			.type("application/json")
			.send({
				detail: "Not found.",
			});
	}
};

export default obtainToken;
