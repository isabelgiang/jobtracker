import { NextFunction, Request, Response } from 'express';
import { Stage, StageInputs } from "../models/stage.model";
import { HttpException } from "../utils/error";
import { pgPool } from '../database';
import { logger } from '../utils/logger';

// StagesHandler handles requests to /v1/applications/:applicationID/stages
export const StagesHandler = {
    // Read all stages for an application
    get : async (req : Request, res : Response, next : NextFunction) => {
        try {
            const applicationID = req.params.applicationID;

            // Try querying results from DB
            let result;
            try {
                const query = 'SELECT * FROM stages WHERE "applicationID" = $1'
                result = await pgPool.query(query, [applicationID]);
            } catch (err) {
                next(new HttpException(500, `error querying from postgres: ${err}`));
                return;
            }

            // TODO: handle no results
            const stages = result.rows;

            // Return array of stages as JSON
            res.status(200).json(stages);
        } catch (err) {
            next(err);
        }
    },
    // Put a stage into the store
    post : async (req : Request, res : Response, next : NextFunction) => {
        try {
            const applicationID = req.params.applicationID;

            // TODO: validate inputs, e.g. db.ToStage(stageInputs)
            const { stageType, stageDate, durationMins, notes } = req.body;

            let result;
            try {
                const query = `
                INSERT INTO stages ("applicationID", "stageType", "stageDate", "durationMins", notes, "createdDate", "updatedDate")
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
                `
                const now = new Date()
                result = await pgPool.query(
                    query,
                    [applicationID, stageType, stageDate, durationMins, notes, now, now]
                );
            } catch (err) {
                next(new HttpException(500, `error querying from postgres: ${err}`));
                return;
            }

            // TODO: handle 0 rows returned by insert
            const stage : Stage = result.rows[0];
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
            const stageID = req.params.stageID;
            // TODO: Validate request inputs

            // TODO: Update stage with requested values and return updated stage
            const { stageType, stageDate, durationMins, notes } = req.body;

            let result;
            try {
                const query = `
                UPDATE stages
                SET
                    "stageType" = $1,
                    "stageDate" = $2,
                    "durationMins" = $3,
                    notes = $4,
                    "updatedDate" = $5
                WHERE id = $6
                RETURNING *;
                `
                const now = new Date()
                result = await pgPool.query(
                    query,
                    [stageType, stageDate, durationMins, notes, now, stageID]
                );
            } catch (err) {
                next(new HttpException(500, `error querying from postgres: ${err}`));
                return;
            }

            // TODO: handle 0 rows returned by update
            const stage : Stage = result.rows[0];
            res.status(200).json(stage);
        } catch (err) {
            next(err);
        }
    },
    // Delete a stage
    delete : async (req : Request, res : Response, next : NextFunction) => {
        try {
            const stageID = req.params.stageID;

            let result;
            try {
                const query = 'DELETE FROM stages WHERE id = $1;'
                result = await pgPool.query(query, [stageID]);
            } catch (err) {
                next(new HttpException(500, `error querying from postgres: ${err}`));
                return;
            }

            // Check if row was deleted successfully
            if (result.rowCount < 1) {
                next(new HttpException(500, `error deleting stage from db`))
                return;
            }
            res.status(200).send('stage deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}
