import {Router} from "express";
import payments from "../controllers/payments-controller";
import errorHandler from "../utils/error-handler";
import initiatePayment from "../controllers/initiate-payment-controller";

const router = Router({mergeParams: true});

router.post("/status/:paymentId", errorHandler(payments));
router.post("/initiate", errorHandler(initiatePayment));


export default router;
