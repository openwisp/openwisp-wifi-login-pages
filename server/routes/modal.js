import {Router} from "express";
import modalContent from "../controllers/modal-content-controller";
import errorHandler from "../utils/error-handler";

const router = Router({mergeParams: true});

router.get("/", errorHandler(modalContent));

export default router;
