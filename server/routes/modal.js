import {Router} from "express";
import modalContent from "../controllers/modal-content-controller";

const router = Router({mergeParams: true});

router.get("/", modalContent);

export default router;
