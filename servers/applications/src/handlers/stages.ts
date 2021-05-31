import { NextFunction, Request, Response } from 'express';
import { Stage, StageInputs, ToStageInputs } from "../models/stage.model";
import { HttpException } from "../utils/error";
import { db } from '../database';
import { logger } from '../utils/logger';

// StagesHandler handles requests to /v1/applications/:applicationID/stages
export const StagesHandler = {
    // Read all stages for an application
    get : async (req : Request, res : Response, next : NextFunction) => {
        try {
            const applicationID = parseInt(req.params.applicationID);
            const stages = await db.GetApplicationStages(applicationID);

            // Return array of stages as JSON
            res.status(200).json(stages);
        } catch (err) {
            next(err);
        }
    },
    // Put a stage into the store
    post : async (req : Request, res : Response, next : NextFunction) => {
        try {
            const applicationID = parseInt(req.params.applicationID);
            const stageInputs = ToStageInputs(req.body)
            const stage = await db.InsertStage(applicationID, stageInputs);

            // Return inserted stage as JSON
            res.status(201).json(stage);
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
            const stageID = parseInt(req.params.stageID);
            const stageInputs = ToStageInputs(req.body)
            const stage = await db.UpdateStage(stageID, stageInputs);

            res.status(200).json(stage);
        } catch (err) {
            next(err);
        }
    },
    // Delete a stage
    delete : async (req : Request, res : Response, next : NextFunction) => {
        try {
            const stageID = parseInt(req.params.stageID);
            await db.DeleteStage(stageID);
            res.status(200).send('stage deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}
