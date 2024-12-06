import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import User from '../models/user.models.js';
import apiResponse from "../utils/apiResponse.js";

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

export { registerUser };
