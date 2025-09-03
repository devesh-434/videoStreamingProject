import { Router } from 'express';
import {
    publishATweet,
    deleteTweet,
    getAllTweets,
    updateATweet
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(publishATweet);
router.route("/user/:userId").get(getAllTweets);
router.route("/:tweetId").delete(deleteTweet).patch(updateATweet);

export default router