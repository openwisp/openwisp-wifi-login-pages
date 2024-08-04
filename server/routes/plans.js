import {Router} from "express";
import plans from "../controllers/plans-controller";
import errorHandler from "../utils/error-handler";
import buyPlan from "../controllers/buy-plan-controller";
import currentPlan from "../controllers/current-plan-controller";

const router = Router({mergeParams: true});

router.get("/", errorHandler(plans));
router.post("/buy", errorHandler(buyPlan));
router.get("/current", errorHandler(currentPlan));


export default router;
