import {Router} from "express";

import passwordReset from "../controllers/password-reset-controller";

const router = Router({mergeParams: true});

router.post("/", passwordReset);

export default router;
