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
            
        logger.error(`[message] ${message} | [status] ${status}`);
        res.status(status).json({ message });
    } catch (error) {
        next(error);
    }
};


