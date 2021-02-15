import {Router} from "express";
import plans from "../controllers/plans-controller";

const router = Router({mergeParams: true});

router.get("/", plans);

export default router;
