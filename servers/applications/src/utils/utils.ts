import { application, NextFunction, Request, Response } from 'express';
import { Application } from "../models/application.model";
import { Stage } from "../models/stage.model";
import { User } from "../models/user.model";
import { HttpException } from "./error";
import { logger } from './logger';
import { db } from '../database';


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
        const userProfile = await db.GetUser(user.id);
        user.email = userProfile.email;
        res.locals.user = user;
        next();
    } catch (err) {
        next(err);
    }
}

export const GetApplication = async (req : Request, res : Response, next : NextFunction) => {
    try {
        // Look for application in DB using applicationID path param
        const applicationID = parseInt(req.params.applicationID);
        const application : Application = await db.GetApplication(applicationID);

        // Pass the application and creatorID info to the next handler
        res.locals.application = application;
        res.locals.creatorID = application.userID;
        next();
    } catch (err) {
        next(err);
    }
}

export const GetStage = async (req : Request, res : Response, next : NextFunction) => {
    try {
        // Look for stage in DB using stageID path param
        const stageID = parseInt(req.params.stageID);
        const [stage, creatorID] = await db.GetStage(stageID);

        // Then pass the stage and creatorID info to the next handler
        res.locals.stage = stage;
        res.locals.creatorID = creatorID;
        next();
    } catch (err) {
        next(err);
    }
}

export const IsCreator = (req : Request, res : Response, next : NextFunction) => {
    try {
        const creatorID : number = res.locals.creatorID
        if (!creatorID) {
            next(new HttpException(500, 'creatorID was expected but not received'));
            return;
        }

        const user : User = res.locals.user;
        if (!user) {
            next(new HttpException(500, 'user was expected but not received'));
            return;
        }

        if (creatorID != user.id) {
            next(new HttpException(403, 'user is not the creator of this resource'));
        }
        next();
    } catch (err) {
        next(err);
    }
}

export const isEmpty = (value : string | number | object | Application | Stage | User | null | undefined) : boolean => {
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
