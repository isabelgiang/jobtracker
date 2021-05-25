import mongoose from 'mongoose';
import { NextFunction, Request, Response } from 'express';
import { logger } from './logger';
export class HttpException extends Error {
    public status : number;
    public message : string;
    constructor(status : number, message : string) {
        super(message);
        this.status = status;
        this.message = message;
    }
}

export const errorMiddleware = (err : HttpException, req : Request, res : Response, next : NextFunction) => {
    try {
        let status : number = err.status || 500;
        let message : string = err.message || 'unexpected error occured';
        if (err instanceof mongoose.Error.CastError) {
            status = 400;
            message = `parameter ${err.value} is in an invalid format for the schema field ${err.kind}`
        }
            
        logger.error(`[message] ${message} | [status] ${status}`);
        res.status(status).json({ message });
    } catch (error) {
        next(error);
    }
};


