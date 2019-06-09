import axios from "axios";
import merge from "deepmerge";
import qs from "qs";

import config from "../config.json";
import defaultConfig from "../utils/default-config";

const passwordReset = (req, res) => {
	const reqOrg = req.params.organization;
	const validSlug = config.some(org => {
		if (org.slug === reqOrg) {
			// merge default config and custom config
			const conf = merge(defaultConfig, org);
			const {host} = conf;
			let resetUrl = conf.proxy_urls.password_reset;
			// replacing org_slug param with the slug
			resetUrl = resetUrl.replace("{org_slug}", org.slug);
			const timeout = conf.timeout * 1000;
			const {email} = req.body;

			// make AJAX request
			axios({
				method: "post",
				headers: {"content-type": "application/x-www-form-urlencoded"},
				url: `${host}${resetUrl}`,
				timeout,
				data: qs.stringify({email}),
			})
				.then(response => {
					// forward response
					res
						.status(response.status)
						.type("application/json")
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

export default passwordReset;
