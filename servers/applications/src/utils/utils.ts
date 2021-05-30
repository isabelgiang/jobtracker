import { NextFunction, Request, Response } from 'express';
import { Application } from "../models/application.model";
import { Stage } from "../models/stage.model";
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

export const GetStage = async (req : Request, res : Response, next : NextFunction) => {
    try {
        // Look for stage in DB using stageID path param
        const stageID = req.params.stageID;
        
        // Try querying stage from DB
        const query = `
        SELECT stages.*, applications."userID"
        FROM stages
        INNER JOIN applications
            ON stages."applicationID" = applications.id
        WHERE stages.id = $1;
        `
        let result;
        try {
            result = await pgPool.query(query, [stageID]);
        } catch (err) {
            next(new HttpException(500, `error querying from DB: ${err}`));
            return;
        }
    
        // Pass an exception if the stage doesn't exist
        const stage : Stage = result.rows[0];
        if (isEmpty(stage)) {
            next(new HttpException(400, `stage with id ${stageID} doesn't exist`));
            return;
        }
        logger.info(`Retrieved stage info ${JSON.stringify(stage)} from DB.`)

        // Otherwise pass the stage info to the next handler
        res.locals.stage = stage;
        next();
    } catch (err) {
        next(err);
    }
}

export const IsCreator = (req : Request, res : Response, next : NextFunction) => {
    try {
        let resource : Application | Stage | undefined;
        if (req.path.includes('applications')) {
            resource = res.locals.application;
        } else if (req.path.includes('stages')) {
            resource = res.locals.stage;
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
        
        if (resource.userID.toString() != user.id) {
            next(new HttpException(403, 'user is not the creator of this stage'));
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
