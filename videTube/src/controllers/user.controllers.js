import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import  uploadOnCloudinary from "../utils/cloudinary.js";
import User from '../models/user.models.js';

const registerUser = asyncHandler ( async (req, res) => {
    const {fullname, email, username, password} = req.body

    if([fullname, email, username, password].some((field) => field?.trim))
    {
        throw new apiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{username}, {password}]
    })

    if(existedUser)
    {
        throw new apiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath)
    {
        throw new apiError(400, "Avatar image is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    let coverImage = ""

    if(coverLocalPath)
    {
        coverImage = await uploadOnCloudinary(coverLocalPath)
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })
})

export {
    registerUser
}