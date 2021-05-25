import { NextFunction, Request, Response } from 'express';
import { ChannelModel, Channel } from "../models/channel.model";
import { MessageModel, Message } from "../models/message.model";
import { User } from "../models/user.model";

import { logger } from "../utils/logger";
import { HttpException } from "../utils/error";
import { getChannel, isEmpty, isAuthorized, isCreator, queryUserProfile } from "../utils/utils";


export const ChannelHandler = { 
    get : async  (req : Request, res : Response, next : NextFunction) => {
        try {
            // Immediately error if the user wasn't successfully
            // passed from the GetUser middleware
            const user : User = res.locals.user;
            if (!user) {
                next(new HttpException(500, 'user was expected but not received'));
                return;
            }

            // Retrieve all channels
            logger.info("fetching channels from MongoDB");

            // Get all channels that aren't private
            const publicChannels : Channel[] = await ChannelModel.find({ private : { $eq: false }})
            // Get all channels that are private and have the user as a member
            const allowedChannels : Channel[] = await ChannelModel.find({
                private : { $eq: true },
                members : { $elemMatch: { id: user.id } } 
            });  
            // Send channels as JSON
            res.json(publicChannels.concat(allowedChannels));
        } catch (err) {
            next(err);
        }
    },
    post : async (req : Request, res : Response, next : NextFunction) => {
        try { 
            // Immediately error if the user wasn't successfully
            // passed from the GetUser middleware
            const user : User = res.locals.user;
            if (!user) {
                next(new HttpException(500, 'user was expected but not received'));
                return;
            }

            // Check for required parameters
            if (!req.body.name || isEmpty(req.body.name)) {
                next(new HttpException(400, 'missing channel name')); 
                return;
            }
            // Check if channel name already exists 
            const channelExists = await ChannelModel.exists({ name: req.body.name });
            if (channelExists === true) {
                next(new HttpException(400, `channel ${req.body.name} already exists`));
                return;
            } 

            // Create a new channel in the MongoDB collection
            logger.info(`user ${JSON.stringify(user)} is creating channel`);
            try {
                const channel : Channel = await ChannelModel.create({
                    name: req.body.name,
                    description: req.body.description,
                    private: req.body.private,
                    creator: user,
                    members: req.body.private === true ? [ user ] : []
                }); 
                // Reply with newly created channel
                res.status(201).json(channel);
            } catch (err) {
                next(err);
            }
        } catch (err) {
            next(err);
        }
    }
}

export const SpecificChannelHandler = {
    get : async(req : Request, res : Response, next : NextFunction) => {
        try {
            // Immediately error if the user wasn't successfully
            // passed from the GetUser middleware
            const user : User = res.locals.user;
            if (!user) {
                next(new HttpException(500, 'user was expected but not received'));
                return;
            }

            const channel : Channel = await getChannel(req, res);
            // Check if channel is private, and if this user is authorized to view it
            if (!isAuthorized(user, channel)) {
                next(new HttpException(403, `user ${user.id} is not authorized to view channel ${channel.name}`));
                return;
            }

            // Retrieve all messages
            const paginationLimit = 100;
            logger.info(`fetching most recent ${paginationLimit} messages for channel ${channel.name}`);

            // Paginate responses if given query parameter
            let messages : Message[]; 
            if (req.query.before) {
                messages = await MessageModel.find( { channelID : channel._id, '_id': { $gt: req.query.before } }).limit(paginationLimit);   
            } else {
                messages  = await MessageModel.find( { channelID : channel._id } ).limit(paginationLimit);
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(messages);
        } catch (err) {
            next(err);
        }
    },
    post : async(req : Request, res : Response, next : NextFunction) => {
        try {
            // Immediately error if the user wasn't successfully
            // passed from the GetUser middleware
            const user : User = res.locals.user;
            if (!user) {
                next(new HttpException(500, 'user was expected but not received'));
                return;
            }

            const channel : Channel = await getChannel(req, res);
            // Check if channel is private, and if this user is authenticated 
            if (!isAuthorized(user, channel)) {
                next(new HttpException(403, `user ${user.id} is not authorized to post to this channel ${channel.name}`));
                return;
            }

            // Create a new message for this channel 
            logger.info(`user ${JSON.stringify(user)} is creating a new message for channel ${JSON.stringify(channel.name)}`);
            try {
                const message : Message = await MessageModel.create({
                    channelID: channel._id,
                    body: req.body.body, 
                    creator: user
                }); 
                // Reply with newly created channel
                res.status(201).json(message);
            } catch (err) {
                next(err);
            }
        } catch (err) {
            next(err);
        }
    },
    patch : async(req : Request, res : Response, next : NextFunction) => {

        try {
            // Immediately error if the user wasn't successfully
            // passed from the GetUser middleware
            const user : User = res.locals.user;
            if (!user) {
                next(new HttpException(500, 'user was expected but not received'));
                return;
            }

            const channel : Channel = await getChannel(req, res);

            // Check if this channel's name is "general"
            if (channel.name == 'general') {
                next(new HttpException(400, `channel 'general' cannot be updated`));
                return;
            }
            
            // Check if this user created this channel
            if (!isCreator(user, channel)) {
                next(new HttpException(403, `user ${user.id} is not the creator of channel ${channel.name}`));
                return;
            }

            // Update channel with name and/or description
            const { name, description } = req.body;
            if (!name && !description) {
                next(new HttpException(400, `missing name and description. at least one is required.`))
            }
            if (name) {
                channel.name = name;
            }
            if (description) {
                channel.description == description;
            } else if (!description && channel.description) {
                channel.description == '';
            }
            channel.editedAt = Date.now();
            await channel.save();

            // Send copy of updated channel
            res.status(200).header('application/json').send(channel);
        } catch (err) {
            next(err);
        }
    },
    delete : async(req : Request, res : Response, next : NextFunction) => {
        try {
            // Immediately error if the user wasn't successfully
            // passed from the GetUser middleware
            const user : User = res.locals.user;
            if (!user) {
                next(new HttpException(500, 'user was expected but not received'));
                return;
            }

            const channel : Channel = await getChannel(req, res);
            
            // Check if this channel's name is "general"
            if (channel.name == 'general') {
                next(new HttpException(400, `channel 'general' cannot be deleted`));
                return;
            }

            // Check if this user created this channel
            if (!isCreator(user, channel)) {
                next(new HttpException(403, `user ${user.id} is not the creator of channel ${channel.name}`));
                return;
            }
            const session = await ChannelModel.startSession();

            try {
                await session.withTransaction(async () => {
                    // Delete channel
                    await ChannelModel.deleteOne({ _id : channel._id });
                    // Delete messages associated with channel
                    const deleteMessagesResults = await MessageModel.deleteMany({
                        channelID : channel._id
                    });
                    logger.info(`${deleteMessagesResults.deletedCount} message(s) were deleted.`);
                });
            } catch (err) {
                next(new HttpException(500, `unexpected error during transaction deleting channel ${channel.id}: ${err}`));
                return;
            } finally {
                session.endSession();
            }
            res.status(200).send(`channel ${channel.id} deleted successfully`);
        } catch (err) {
            next(err);
        }
    }
}

export const MembersHandler = {
    post : async(req : Request, res : Response, next : NextFunction) => {
        try {
            // Validate request has required info
            if (isEmpty(req.body.id)) {
                next(new HttpException(400, 'request is missing user id'));
                return;
            }

            // Immediately error if the user wasn't successfully
            // passed from the GetUser middleware
            const user : User = res.locals.user;
            if (!user) {
                next(new HttpException(500, 'user was expected but not received'));
                return;
            }
            
            const channel : Channel = await getChannel(req, res);

            // Check if this user created this channel
            if (!isCreator(user, channel)) {
                next(new HttpException(403, `user ${user.id} is not the creator of channel ${channel.name}`));
                return;
            }

            // Check if this channel is private
            if (!channel.private) {
                next(new HttpException(400, `channel ${channel.name} is not private`));
                return;
            }

            // Query the user store to make sure the requested member to be added is a valid user
            const newMember : User = await queryUserProfile(req.body.id);
            // Pass an exception if the email in the request doesn't match the email in postgres
            if (req.body.email != newMember.email) {
                next(new HttpException(400, `the member to be added is not a valid user`));
                return;
            }
            
            // Check if user is already a member of this channel
            if (!channel.members) {
                // At a minimum the channel should have the creator as a member
                channel.members = [ user ]; 
            }
            const isMember : boolean = !!(channel.members.filter(member => member.id == newMember.id).length);
            if (isMember === true) {
                next(new HttpException(400, `user ${newMember.id} is already a member of this channel`));
                return;
            }
            
            // Add a new member to this channel
            channel.members.push(newMember);
            await channel.save();
            res.status(201).send(`created new member ${newMember.id} in channel ${channel.name}`);
        } catch (err) {
            next(err);
        }
    },
    delete : async(req : Request, res : Response, next : NextFunction) => {
        try {
            // Immediately error if the user wasn't successfully
            // passed from the GetUser middleware
            const user : User = res.locals.user;
            if (!user) {
                next(new HttpException(500, 'user was expected but not received'));
                return;
            }

            const channel : Channel = await getChannel(req, res);

            // Check if this user created this channel
            if (!isCreator(user, channel)) {
                next(new HttpException(403, `user ${user.id} is not the creator of channel ${channel.name}`));
                return;
            }
            // Check if this channel is private
            if (!channel.private) {
                next(new HttpException(400,`channel ${channel.name} is not private`)); 
                return;
            }
            
            // Remove member from channel
            const memberToRemove : User = req.body;
            // Check if the user being removed is the creator
            if (memberToRemove.id == channel.creator.id) {
                next(new HttpException(400, `user ${user.id} is the creator of the channel and cannot be removed. try deleting the channel instead`))
                return;
            }
            if (channel.members) {
                let members = []
                let hasMemberToRemove = false;
                for (let member of channel.members) {
                    if (member.id != memberToRemove.id) {
                        members.push(member);
                    } else {
                        hasMemberToRemove = true;
                    }
                }
                if (hasMemberToRemove === false) {
                    next(new HttpException(400, `user ${memberToRemove.id} is not a member of channel ${channel.name}`));
                    return;
                }
                channel.members = members;
                await channel.save();
                res.send(`removed member ${memberToRemove.id} from channel ${channel.name}`);
                return;
            }
            next(new HttpException(400, `user ${memberToRemove.id} is not a member of channel ${channel.name}`));
        } catch (err) {
            next(err);
        }
    },
}

