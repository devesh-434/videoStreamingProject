import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

const getAllVideos = asyncHandler (async(req,res)=>{
    let {page = 1, limit=10, query, sortBy='createdAt', sortType='desc', userId} = req.query
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400, "Invalid user Id")
    }
    const matchStage = {
        owner: new mongoose.Types.ObjectId(userId)
    }
    if(query){
        matchStage.title = {$regex: query, $options: "i"}
    }
    const sortStage = {};
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;
    const videos = await Video.aggregate([
        { $match: matchStage },
        { $sort: sortStage },
        { $skip: (page - 1) * limit },
        { $limit: limit },
    ])

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler (async(req, res)=>{

    // 1) Destructure and get the title and description
    const {title, description} = req.body
    if(title === '' || description === ''){
        throw new ApiError(400, "Some fields are missing")
    }

    // 2) Upload the video & thumbnail on cloudinary 
    const videoLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    //If user hasnt provided
    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(400, "Some fields are missing")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    //If cloudinary upload fails
    if (!videoFile || !thumbnail){
        throw new ApiError(400, "Cloudinary upload failed")
    }

    // 3) Create an object with all the details and upload
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user?._id
    })

    const isVideoPublished = await Video.findById(video._id)
    if(!isVideoPublished){
        throw new ApiError(500, "Something went wrong while uploading video")
    }

    return res.status(201).json(
        new ApiResponse(200, isVideoPublished, "Video published successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Find and increment views in one go
    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    )

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const togglePublishStatus = asyncHandler ( async(req, res) => {
    const {videoId} = req.params;
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to toggle this video");
    }

    //Flip the flag
    video.isPublished = !video.isPublished
    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video status changed successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path

    // 1) Find video
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // 2) Authorization check
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to change this video")
    }

    // 3) Field validation
    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "Fields are missing")
    }

    // 4) Upload new thumbnail
    if(thumbnailLocalPath){
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnail) {
            throw new ApiError(400, "Error while updating thumbnail")
        }
        video.thumbnail = thumbnail.url
    }

    // 5) Update fields
    if(title){
        video.title = title
    }
    if(description){
        video.description = description
    }
    
    await video.save()

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Fields updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // Step 1: Validate if the provided videoId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Step 2: Find and delete the video in one DB call
    // - `_id: videoId` ensures we are targeting the correct video
    // - `owner: req.user._id` ensures the logged-in user owns the video
    const deletedVideo = await Video.findOneAndDelete({
        _id: videoId,
        owner: req.user._id
    })

    // Step 3: Handle case where no video was found
    // - Could be because the video doesn't exist
    // - Or because the user is not authorized to delete it
    if (!deletedVideo) {
        throw new ApiError(404, "Video not found or you are not authorized to delete it")
    }

    // Step 4: Send success response
    // - No need to return the deleted document unless required
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Video deleted successfully"))
})

export {publishAVideo, getVideoById, togglePublishStatus, updateVideo, deleteVideo, getAllVideos}