import {Router} from "express";
import plans from "../controllers/plans-controller";
import userUpgradePlan from "../controllers/user-upgrade-plan-controller";
import userCancelUpgradePlan from "../controllers/user-cancel-upgrade-plan-controller";
import errorHandler from "../utils/error-handler";

const router = Router({mergeParams: true});

router.get("/", errorHandler(plans));
router.post("/upgrade", errorHandler(userUpgradePlan));
router.post("/cancel", errorHandler(userCancelUpgradePlan));

export default router;
