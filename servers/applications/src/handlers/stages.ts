import { NextFunction, Request, Response } from 'express';
import { Stage } from "../models/stage.model";
import { HttpException } from "../utils/error";

// StagesHandler handles requests to /v1/applications/:applicationID/stages
export const StagesHandler = {
    // Read all stages for an application
    get : async (req : Request, res : Response, next : NextFunction) => {
        try {
            // TODO: Implement
            res.status(501).send('not implemented');
        } catch (err) {
            next(err);
        }
    },
    // Put a stage into the store
    post : async (req : Request, res : Response, next : NextFunction) => {
        try {
            // TODO: Implement
            res.status(501).send('not implemented');
        } catch (err) {
            next(err);
        }
    }
}

// SpecificStageHandler handles requests to /v1/stages/:stageID
export const SpecificStageHandler = {
    // Read a stage from the store
    get : async (req : Request, res : Response, next : NextFunction) => {
        try {
            // Immediately error if the stage wasn't successfully
            // passed from the GetStage middleware
            const stage : Stage = res.locals.stage;
            if (!stage) {
                next(new HttpException(500, 'stage was expected but not received'));
                return;
            }
            res.status(200).json(stage);
        } catch (err) {
            next(err);
        }
    },
    // Update a stage
    patch : async (req : Request, res : Response, next : NextFunction) => {
        try {
            // Immediately error if the stage wasn't successfully
            // passed from the GetStage middleware
            const stage : Stage = res.locals.stage;
            if (!stage) {
                next(new HttpException(500, 'stage was expected but not received'));
                return;
            }
            // TODO: Pass an error if the request is empty or has empty value

            // TODO: Update stage with requested values and return updated stage
            res.status(501).send('not implemented');

            // res.status(200).json(stage);
        } catch (err) {
            next(err);
        }
    },
    // Delete a stage
    delete : async (req : Request, res : Response, next : NextFunction) => {
        try {
            // Immediately error if the stage wasn't successfully
            // passed from the GetStage middleware
            const stage : Stage = res.locals.stage;
            if (!stage) {
                next(new HttpException(500, 'stage was expected but not received'));
                return;
            }
            // TODO: Delete stage and return success message
            res.status(501).send('not implemented');
            // res.status(200).send('stage deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}
