import {Router} from "express";

import obtainToken from "../controllers/obtain-token-controller";
import passwordChange from "../controllers/password-change-controller";
import passwordResetConfirm from "../controllers/password-reset-confirm-controller";
import passwordReset from "../controllers/password-reset-controller";
import registration from "../controllers/registration-controller";

const router = Router({mergeParams: true});

router.post("/token", obtainToken);
router.post("/password/change", passwordChange);
router.post("/password/reset/confirm/", passwordResetConfirm);
router.post("/password/reset", passwordReset);
router.post("/", registration);

export default router;
