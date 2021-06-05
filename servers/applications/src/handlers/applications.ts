import { NextFunction, Request, Response } from 'express';
import { Application, ApplicationInputs, ToApplicationInputs } from "../models/application.model";
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
            const userID = parseInt(req.query.userid as string)
            if (!userID) {
                next(new HttpException(500, 'user was expected but not received'));
                return;
            }

            const applications : Application[] = await db.GetUserApplications(userID);
            logger.info("fetching applications from Postgres");
            res.status(200).json(applications);
        } catch (err) {
            next(err);
        }
    },
    // Put an application into the store
    post : async (req : Request, res : Response, next : NextFunction) => {
        try {
            const userID = parseInt(req.query.userid as string)
            if (!userID) {
                next(new HttpException(500, 'user was expected but not received'));
                return;
            }

            const applicationInputs = ToApplicationInputs(req.body);
            const application : Application = await db.InsertApplication(userID, applicationInputs);
            logger.info(`user ${userID} is creating an application`);
            res.status(201).send(application);
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
            const applicationID = parseInt(req.params.applicationID);
            const application = db.GetApplication(applicationID); 
            res.status(200).json(application);
        } catch (err) {
            next(err);
        }
    },
    // Update an application
    patch : async(req : Request, res : Response, next : NextFunction) => {
        try {
            const applicationID = parseInt(req.params.applicationID);
            const applicationInputs = ToApplicationInputs(req.body);
            const application = db.UpdateApplication(applicationID, applicationInputs); 
            res.status(200).json(application);
        } catch (err) {
            next(err);
        }
    },
    // Delete an application
    delete : async(req : Request, res : Response, next : NextFunction) => {
        try {
            const applicationID = parseInt(req.params.applicationID);
            await db.DeleteStage(applicationID); 
            res.status(200).send(`application ${applicationID} deleted successfully`);
        } catch (err) {
            next(err);
        }
    }
}
