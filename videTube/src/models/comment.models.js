import mongoose from 'mongoose';

const commentSchema = new Schema(
    {
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        content: {
            type: String,
            required: true
        }, 
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }, { timestamps: true }
)