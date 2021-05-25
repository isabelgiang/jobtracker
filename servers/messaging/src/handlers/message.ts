import { NextFunction, Request, Response } from 'express';
import { Message, MessageModel } from "../models/message.model";
import { HttpException } from "../utils/error";

export const SpecificMessageHandler = {
    patch : async (req : Request, res : Response, next : NextFunction) => {
        try {
            // Immediately error if the message wasn't successfully
            // passed from the getMessage middleware
            const message : Message = res.locals.message;
            if (!message) {
                next(new HttpException(500, 'message was expected but not received'));
                return;
            }
            
            // Pass an error if the request doesn't have a body field
            // or if the message body is empty
            const update = req.body.body;
            if (update === undefined) {
                next(new HttpException(400, 'request missing the "body" field'));
                return;
            }
            else if (update.length === 0) {
                next(new HttpException(400, 'message update body cannot be empty'));
                return;
            }

            // Update message body with request JSON
            // and return sucess message
            message.body = update;
            message.editedAt = Date.now()
            message.save();
            res.status(200).json(message);
        } catch (err) {
            next(err);
        }
    },
    delete : async (req : Request, res : Response, next : NextFunction) => {
        try {
            // Immediately error if the message wasn't successfully
            // passed from the getMessage middleware
            const message : Message = res.locals.message;
            if (!message) {
                next(new HttpException(500, 'message was expected but not received'));
                return;
            }
            // Delete message and return success message
            await MessageModel.deleteOne({ _id: message._id });
            res.status(200).send('message deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}
