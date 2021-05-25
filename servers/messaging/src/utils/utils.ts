import { NextFunction, Request, Response } from 'express';
import { Channel, ChannelModel } from "../models/channel.model";
import { Message, MessageModel } from "../models/message.model";
import { User } from "../models/user.model";
import { HttpException } from "./error";
import { logger } from './logger';
import { pgPool } from '../database';


export const queryUserProfile = async (id : string) : Promise<User> => {
    let result;
    try {
        result = await pgPool.query('SELECT * FROM users WHERE id = $1', [id]);
    } catch (err) {
        throw new HttpException(500, `error querying from postgres: ${err}`);
    }
    
    const userProfile : User = result.rows[0];
    if (isEmpty(userProfile)) {
        throw new HttpException(400, `user with id ${id} doesn't exist`);
    }
    if (isEmpty(userProfile.email)) {
        throw new HttpException(500, `email is missing for user with id ${id}`);
    }
    return userProfile;
}

export const getChannel = async (req : Request, res : Response) : Promise<Channel> => {
    logger.info(`getting channelID from ${req.originalUrl}`);
    const channelID = req.params.channelID;
    if (!channelID || isEmpty(channelID)) {
        throw new HttpException(400, `missing channel ID: ${req.originalUrl}`);
    }
    try {
        const channel = await ChannelModel.findById(channelID);
        if (!channel || isEmpty(channel)) {
            throw new HttpException(400, `there is no channel with the id ${channelID}`); 
        }

        return channel;
    } catch (err) {
        throw err;
    }
}

export const GetUser = async (req : Request, res : Response, next : NextFunction) => {
    let user : User;
    try {
        // Get user info from the header
        // Pass an error if it's empty
        let authUser = req.get('X-User') || '';
        if (isEmpty(authUser)) {
            next(new HttpException(401, 'missing X-User authentication info'));
            return;
        }
        // Parse user into JSON
        // Pass an error if either id or email are empty
        user = JSON.parse(authUser);
        if (isEmpty(user.id)) {
            const errorMessage = `missing id in X-User authentication info: ${authUser}`
            next(new HttpException(400, errorMessage));
            return;
        }
        // Get email from user store
        const userProfile = await queryUserProfile(user.id);
        user.email = userProfile.email;
        res.locals.user = user;
        next();
    } catch (err) {
        next(err);
    }
}

export const GetMessage = async (req : Request, res : Response, next : NextFunction) => {
    try {
        // Look for message in DB using messageID path param
        const messageID = req.params.messageID;
        const message = await MessageModel.findById(messageID);

        // If the message doesn't exist, pass an error
        // Otherwise pass the message to next handler
        if (isEmpty(message)) {
            next(new HttpException(401, 'this message does not exist'));
            return;
        }
        res.locals.message = message;
        next();
    } catch (err) {
        next(err);
    }
}

export const IsCreator = (req : Request, res : Response, next : NextFunction) => {
    try {
        let resource : Channel | Message | undefined;
        if (req.path.includes('channels')) {
            resource = res.locals.channel;
        } else if (req.path.includes('messages')) {
            resource = res.locals.message;
        }
        if (!resource) {
            next(new HttpException(500, 'resource was expected but not received'));
            return;
        }

        const user : User = res.locals.user;
        if (!user) {
            next(new HttpException(500, 'user was expected but not received')); 
            return;
        }
        
        if (resource.creator.id != user.id) {
            next(new HttpException(403, 'user is not the creator of this message'));
        }
        next();
    } catch (err) {
        next(err);
    }
}

/**
 *  @method isEmpty
 *  @param { string | number | object | Channel | User }
 *  @returns boolean
 *  @description Returns true if the given value is null, undefined, or empty.
 */
export const isEmpty = (value : string | number | object | Channel | Message | User | null | undefined) : boolean => {
    if (value === null) {
        return true;
    } else if (typeof value !== 'number' && value === '') {
        return true;
    } else if (value === 'undefined' || value === undefined) {
        return true;
    } else if (value !== null && typeof value === 'object' && !Object.keys(value).length) {
        return true;
    } else {
        return false;
    }
}


export const isAuthorized = (user : User, channel : Channel) : boolean => {
    if (!channel.private) {
        return true;
    }
    if (!channel.members || isEmpty(channel.members)) {
        return false;
    }
    for (let member of channel.members) {
        if (member.id == user.id) {
            return true;
        }
    }
    return false;
}

export const isCreator = (user : User, resource : Channel | Message) : boolean => {
    if (!resource || isEmpty(resource)) {
        return false;
    }
    return resource.creator.id == user.id;
}
