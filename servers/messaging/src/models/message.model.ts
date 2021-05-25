import { model, Schema, Document } from 'mongoose';
import { User, UserSchema } from './user.model';

export interface Message extends Document {
    channelID: string;  // ID of channel to which this message belongs
    body: string;       // the message text
    createdAt: number;  // date/time the message was created
    creator: User;      // copy of the entire profile of the user who created this message
    editedAt: number;   // date/time the message body was last edited
}

export const MessageSchema: Schema = new Schema({
    channelID: { 
        type: String,
        required: true,
        minLength: 12,   // ChannelID will be a MongoDB ObjectId: https://docs.mongodb.com/manual/reference/method/ObjectId/
        maxLength: 24
    },
    body: {
        type : String,
        required: true,
        minLength: 1,    // Don't allow empty messages
        maxLength: 4000  // Inspired by Slack message limit: https://api.slack.com/docs/rate-limits#rate-limits__rtm-apis__posting-messages
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    creator: { 
        type: UserSchema,
        required: true
    },
    editedAt: {
        type: Date,
        default: Date.now
    }
});

export const MessageModel = model<Message>('Message', MessageSchema);
