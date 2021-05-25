import { model, Schema, Document } from 'mongoose';
import { User, UserSchema } from './user.model';

export interface Channel extends Document {
    name: string;
    description: string;
    creator: User;
    private: boolean;
    members: User[];
    createdAt: number;
    editedAt: number;
}

export const ChannelSchema: Schema = new Schema({
    name: { 
        type: String,
        required: true,
        unique: true,
        minLength: 3,
        maxLength: 255,
    },
    description: {
        type : String,
        maxLength: 255,
        default: ""
    },
    creator: { 
        type: UserSchema,
        required : true
    },
    private: {
        type: Boolean,
        default: false
    },
    members: [{
        type: UserSchema,
        default: []
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    editedAt: {
        type: Date,
        default: Date.now
    }
});

export const ChannelModel = model<Channel>('Channel', ChannelSchema);
