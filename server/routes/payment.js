import {Router} from "express";
import payments from "../controllers/payments-controller";

const router = Router({mergeParams: true});

router.post("/status/:paymentId", payments);

export default router;
