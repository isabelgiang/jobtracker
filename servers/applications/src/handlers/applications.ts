import { NextFunction, Request, Response } from 'express';
import { Application } from "../models/application.model";
import { User } from "../models/user.model";

import { db } from '../database';
import { logger } from "../utils/logger";
import { HttpException } from "../utils/error";

// ApplicationsHandler handles requests to /v1/users/:userID/applications
export const ApplicationsHandler = {
    // Read all applications for a user
    get : async  (req : Request, res : Response, next : NextFunction) => {
        try {
            // Immediately error if the user wasn't successfully
            // passed from the GetUser middleware
            const user : User = res.locals.user;
            if (!user) {
                next(new HttpException(500, 'user was expected but not received'));
                return;
            }
            const userID = user.id;
            const applications = await db.GetUserApplications(userID);

            logger.info("fetching applications from Postgres");
            res.status(200).json(applications);
        } catch (err) {
            next(err);
        }
    },
    // Put an application into the store
    post : async (req : Request, res : Response, next : NextFunction) => {
        try {
            // Immediately error if the user wasn't successfully
            // passed from the GetUser middleware
            const user : User = res.locals.user;
            if (!user) {
                next(new HttpException(500, 'user was expected but not received'));
                return;
            }

            // TODO: Validate request

            // TODO: Create a new application in Postgres
            // logger.info(`user ${JSON.stringify(user)} is creating an application`);
            res.status(501).send('not implemented');
        } catch (err) {
            next(err);
        }
    }
}

// SpecificApplicationHandler handles requests to /v1/applications/:applicationID
export const SpecificApplicationHandler = {
    // Read an application from the store
    get : async(req : Request, res : Response, next : NextFunction) => {
        try {
            const applicationID = req.params.applicationID;
            // TODO: read the application from the store

            // res.status(200).json(application);
            res.status(501).send('not implemented');
        } catch (err) {
            next(err);
        }
    },
    // Update an application
    patch : async(req : Request, res : Response, next : NextFunction) => {
        try {
            const applicationID = req.params.applicationID;
            // TODO: validate request

            // TODO: update application with requested values

            // TODO: send copy of updated application
            // res.status(200).json(application);
            res.status(501).send('not implemented');
        } catch (err) {
            next(err);
        }
    },
    // Delete an application
    delete : async(req : Request, res : Response, next : NextFunction) => {
        try {
            const applicationID = req.params.applicationID;
            // TODO: delete application and all associated stages within transaction

            // res.status(200).send(`application ${applicationID} deleted successfully`);
            res.status(501).send('not implemented');
        } catch (err) {
            next(err);
        }
    }
}
