import {Router} from "express";
import payments from "../controllers/payments-controller";

const router = Router({mergeParams: true});

router.get("/status/:paymentId", payments);

export default router;
