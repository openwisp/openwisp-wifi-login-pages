import {Router} from "express";
import plans from "../controllers/plans-controller";
import errorHandler from "../utils/error-handler";

const router = Router({mergeParams: true});

router.get("/", errorHandler(plans));

export default router;
