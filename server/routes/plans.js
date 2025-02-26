import {Router} from "express";
import plans from "../controllers/plans-controller";
import userUpgradePlan from "../controllers/user-upgrade-plan-controller";
import errorHandler from "../utils/error-handler";

const router = Router({mergeParams: true});

router.get("/", errorHandler(plans));
router.post("/upgrade", errorHandler(userUpgradePlan));

export default router;
