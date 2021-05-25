import { model, Schema, Document } from 'mongoose';

export interface User extends Document {
    email: string;
    id: string;
}

export const UserSchema : Schema = new Schema({
    email: {
        type : String,
        required: true,
    },
    id: {
        type : String,
        required : true,
    }
})

export const UserModel = model<User>('User', UserSchema);

