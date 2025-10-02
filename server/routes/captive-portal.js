import {Router} from "express";
import captivePortal from "../controllers/captive-portal-controller";
import errorHandler from "../utils/error-handler";

const router = Router({mergeParams: true});

router.get("/", errorHandler(captivePortal));

export default router;
