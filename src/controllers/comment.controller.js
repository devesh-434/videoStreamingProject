import {Comment} from '../models/comment.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import mongoose from 'mongoose'

const publishAComment = asyncHandler(async(req, res) => {
    const {content} = req.body;
    const {videoId} = req.params;
    if (!content || !videoId){
        throw new ApiError(400, "All fields must be provided")
    }
    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: req.user._id
    })
    const isCommentPublished = await Comment.findById(comment._id)
    if(!isCommentPublished){
        throw new ApiError(500, "Operation failed")
    }
    return res.status(201).json(new ApiResponse(200, isCommentPublished, "Comment published successfully"))
})

const deleteComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    const comment = Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400, "Comment not found")
    }
    const deletedComment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id
    })
    if(!deletedComment){
        throw new ApiError(404, "Comment not found or you are not authorized to delete it")
    }
    return res.status(201).json(new ApiResponse(200, null, "Comment deleted successfully"))
})

const getAllVideoComments = asyncHandler(async(req,res) => {
    let {page = 1, limit=10, sortBy='createdAt', sortType='desc'} = req.query
    const {videoId} = req.params
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    const matchStage = {
        video: new mongoose.Types.ObjectId(videoId)
    }
    const sortStage = {};
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;
    const comments = await Comment.aggregate([
        {$match: matchStage},
        {$sort: sortStage},
        { $skip: (page - 1) * limit },
        { $limit: limit }
    ])
    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"))
})

const getAllUserComments = asyncHandler(async(req,res)=>{
    let {page = 1, limit=10, sortBy='createdAt', sortType='desc'} = req.query
    const {userId} = req.params
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400, "Invalid user id")
    }
    const matchStage = {
        owner: new mongoose.Types.ObjectId(userId)
    }
    const sortStage = {};
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;
    const comments = await Comment.aggregate([
        {$match: matchStage},
        {$sort: sortStage},
        {$skip: (page-1)*limit},
        {$limit: limit}
    ])
    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"))
})



export {publishAComment, deleteComment, getAllVideoComments, getAllUserComments}