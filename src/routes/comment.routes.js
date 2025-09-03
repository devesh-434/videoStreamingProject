import { Router } from 'express';
import {
    publishAComment,
    deleteComment,
    getAllVideoComments,
    getAllUserComments
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").get(getAllVideoComments).post(publishAComment);
router.route("/user-comments/:userId").get(getAllUserComments)
router.route("/c/:commentId").delete(deleteComment);

export default router