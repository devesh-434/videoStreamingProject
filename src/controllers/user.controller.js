import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js"
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const registerUser = asyncHandler( async (req, res) => {
    
    // 1) get user details
    const {fullName, email, username, password} = req.body
    // console.log("email", email)

    // 2) validation - not empty
    if([fullName, email, username, password].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }
    // 2.1) Validate email format
    if (!isValidEmail(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    // 3) check if user already exists - (username, email)
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    // 4) check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    // 5) Upload to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    // 6) Create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // 7) Check if user is actually created & also remove pswd and refresh token field from response
    const ifUserCreated =  await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!ifUserCreated){
        throw new ApiError(500, "Something went wrong while registering user")
    }

    // 9) Return response/error
    return res.status(201).json(
        new ApiResponse(200, ifUserCreated, "User registered successfuly")
    )

})

export {registerUser}