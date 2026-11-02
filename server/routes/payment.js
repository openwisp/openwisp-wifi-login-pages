import {Router} from "express";
import paymentGateway from "../controllers/payment-gateway-controller";
import payments from "../controllers/payments-controller";
import errorHandler from "../utils/error-handler";

const router = Router({mergeParams: true});

router.post("/status/:paymentId", errorHandler(payments));
router.get("/:paymentId/gateway", errorHandler(paymentGateway));
router.patch("/:paymentId/gateway", errorHandler(paymentGateway));

export default router;
