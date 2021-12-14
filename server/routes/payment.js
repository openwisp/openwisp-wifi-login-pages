import {Router} from "express";
import payments from "../controllers/payments-controller";
import errorHandler from "../utils/error-handler";

const router = Router({mergeParams: true});

router.post("/status/:paymentId", errorHandler(payments));

export default router;
