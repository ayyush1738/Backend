import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import User from '../models/user.models.js';
import apiResponse from "../utils/apiResponse.js";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'

dotenv.config();

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}



const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    if ([fullname, email, username, password].some((field) => !field?.trim())) {
        throw new apiError(400, 'All fields are required');
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new apiError(409, 'User already exists');
    }

    console.log('Files received:', req.files);

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, 'Avatar image is missing');
    }

    let avatar, coverImage;

    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log('Uploaded Avatar:', avatar);

        if (coverLocalPath) {
            coverImage = await uploadOnCloudinary(coverLocalPath);
            console.log('Uploaded Cover image:', coverImage);
        }
    } catch (error) {
        console.error('Error during Cloudinary upload:', error.message);
        throw new apiError(500, `Cloudinary Upload Error: ${error.message}`);
    }

    try {
        console.log('Creating user with the following data:', {
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || '',
            username: username.toLowerCase(),
            email,
            password,
        });

        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || '',
            username: username.toLowerCase(),
            email,
            password,
        });

        const createdUser = await User.findById(user._id).select(
            '-password -refreshToken'
        );

        if (!createdUser) {
            throw new Error('User was created but cannot be found in DB');
        }

        console.log('User successfully fetched after creation:', createdUser);

        return res.status(201).json(
            new apiResponse(200, createdUser, 'User registered successfully')
        );
    } catch (error) {
        console.error('Error during User Creation:', error.message);

        if (avatar?.public_id) {
            console.log('Rolling back: deleting avatar...');
            await deleteFromCloudinary(avatar.public_id);
        }
        if (coverImage?.public_id) {
            console.log('Rolling back: deleting cover image...');
            await deleteFromCloudinary(coverImage.public_id);
        }

        throw new apiError(
            500,
            `User Creation Error: ${error.message}`
        );
    }
});

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.User._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" 
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, "User logged out successfully"));
})

const refreshAccessToken = asyncHandler(async (req, ers)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken)
    {
        throw new apiError(401, "Refresh Token is required");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if(!user)
        {
            throw new apiError(404, "User not found!/Invalid refresh token!");
        }

        if(incomingRefreshToken != user?.refreshToken)
        {
            throw new apiError(404, "User not found!/Invalid refresh token!");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }

        const {refreshToken: newRefreshToken, accessToken} = await generateAccessAndRefereshTokens(user._id);

        return res.status(200).cookei("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new apiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access Token Refreshed Successfully"));
    } catch (error) {
        throw new apiError(500, "Something went wrong while refreshing the access token");
    }
})

export { registerUser, 
    loginUser,
    refreshAccessToken,
    logoutUser
 };
