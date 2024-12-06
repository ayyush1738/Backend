import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

console.log('Cloudinary Config (before setup):', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

console.log('Cloudinary Config (after setup):', cloudinary.config());

export const uploadOnCloudinary = async (localFilePath) => {
    console.log('Uploading file at:', localFilePath);
    if (!localFilePath) return null;

    try {
        if (!fs.existsSync(localFilePath)) {
            console.error('File does not exist:', localFilePath);
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });
        if (!response.url || !response.public_id) {
            console.error('Invalid Cloudinary Response:', response);
        }
        console.log('File uploaded on Cloudinary. File src:', response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        try {
            fs.unlinkSync(localFilePath);
        } catch (err) {
            console.error('Failed to delete local file:', err);
        }
        return null;
    }
};

export const deleteFromCloudinary = async (publicId) => {
    try {
        console.log('Deleting file with Public Id:', publicId);
        await cloudinary.uploader.destroy(publicId);
        console.log('Deleted from Cloudinary, Public Id:', publicId);
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return null;
    }
};
