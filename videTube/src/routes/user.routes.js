import { Router } from "express";
import {verifyJWT} from "../middleware/auth.middlewares.js" 
import { registerUser, logoutUser } from "../controllers/user.controllers.js";
import { upload } from "../middleware/multer.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        }, {
            name: 'coverImage',
            maxCount: 1
        }
    ]), 
    registerUser
);

export default router;