import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Tweet} from '../models/tweet.model.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const publishATweet = asyncHandler(async(req, res)=>{
    const {content} = req.body
    if(!content){
        throw new ApiError(400, "Please provide content")
    }
    const tweet = await Tweet.create({
        content: content,
        owner: req.user._id
    })
    const isTweeted = await Tweet.findById(tweet._id)
    if(!isTweeted){
        throw new ApiError(500, "Something went wrong in tweeting")
    }
    return res.status(200).json(new ApiResponse(201, isTweeted, "Tweeted successfully"))
})

const getAllTweets = asyncHandler(async(req, res)=>{
    let {page = 1, limit=10, sortBy='createdAt', sortType='desc'} = req.query
    const {userId} = req.params
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400, "Not a valid id")
    }
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)
    const matchStage = {
        owner: new mongoose.Types.ObjectId(userId)
    }
    const sortStage = {};
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;
    const tweets = await Tweet.aggregate([
        {$match: matchStage},
        {$sort: sortStage},
        {$skip: (page-1)*limit},
        {$limit: limit}
    ])

    return res.status(200).json(new ApiResponse(200,tweets, "Tweets fetched successfully"))
})

const deleteTweet = asyncHandler(async(req, res)=>{
    const {tweetId} = req.params
    const tweet = Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(400, "Tweet not found")
    }
    const deletedTweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user._id
    })
    if(!deletedTweet){
        throw new ApiError(404, "Tweet not found or you are not authorized to delete it")
    }
    return res.status(201).json(new ApiResponse(200, null, "Tweet deleted successfully"))
})

const updateATweet = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    const {content} = req.body;
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(400, "Tweet does not exist")
    }
    if(tweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError(400, "Not authorized to update")
    }
    tweet.content = content
    await tweet.save()
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"))
})

export {publishATweet, deleteTweet, getAllTweets, updateATweet}