import {Router} from "express";
import plans from "../controllers/plans-controller";
import errorHandler from "../utils/error-handler";
import buyPlan from "../controllers/buy-plan-controller";

const router = Router({mergeParams: true});

router.get("/", errorHandler(plans));
router.post("/buy", errorHandler(buyPlan));


export default router;
