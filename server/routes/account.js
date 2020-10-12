import {Router} from "express";
import obtainToken from "../controllers/obtain-token-controller";
import passwordChange from "../controllers/password-change-controller";
import passwordResetConfirm from "../controllers/password-reset-confirm-controller";
import passwordReset from "../controllers/password-reset-controller";
import registration from "../controllers/registration-controller";
import getUserRadiusSessions from "../controllers/user-radius-sessions-controller";
import validateToken from "../controllers/validate-token-controller";
import {createMobilePhoneToken, verifyMobilePhoneToken} from "../controllers/mobile-phone-token-controller";
import mobilePhoneNumberChange from "../controllers/mobile-phone-number-change-controller";

const router = Router({mergeParams: true});

router.post("/token", obtainToken);
router.post("/token/validate", validateToken);
router.post("/password/change", passwordChange);
router.post("/password/reset/confirm/", passwordResetConfirm);
router.post("/password/reset", passwordReset);
router.post("/", registration);
router.get("/session/", getUserRadiusSessions);
router.post("/phone/token", createMobilePhoneToken);
router.post("/phone/verify", verifyMobilePhoneToken);
router.post("/phone/change", mobilePhoneNumberChange);

export default router;
