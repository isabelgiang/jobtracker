import express from 'express';
import mongoose from 'mongoose';

import { ChannelHandler, SpecificChannelHandler, MembersHandler } from "./handlers/channel";
import { SpecificMessageHandler } from "./handlers/message";
import { GetUser, GetMessage, IsCreator } from './utils/utils';
import { connectToMongoDB, testPostgresConnection } from "./database";

import { logger } from './utils/logger';
import morganBody from 'morgan-body';
import {errorMiddleware} from './utils/error';

class App {
    public app: express.Application;
    public port: string | number;
    public env: string;
    
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 4000;
        this.env = process.env.NODE_ENV || 'local';

        this.connectToDatabases();
        this.initializeMiddleware();
        this.initializeHandlers();
        this.initializeErrorHandling();
    }

    public listen() {
        this.app.listen(this.port , () => {
            logger.info(`server listening on port ${this.port}`);  
        });
    }

    public getServer() {
        return this.app;
    }

    private connectToDatabases() {
        testPostgresConnection();
        connectToMongoDB();

        mongoose.connection.on('error', (err) => {
                logger.error(`unexpected error during MongoDB connection: ${err}`); 
            })
            .on('disconnected', connectToMongoDB)
    }

    private initializeMiddleware() {
        if (this.env === 'local') {
            morganBody(this.app);
        }

        this.app.use(express.json());
        this.app.use(GetUser);
    }

    private initializeHandlers() {
        // /v1/channels
        this.app.get("/v1/channels", ChannelHandler.get);
        this.app.post("/v1/channels", ChannelHandler.post);
        
        // /v1/channels/:channelID
        this.app.get("/v1/channels/:channelID", SpecificChannelHandler.get);
        this.app.delete("/v1/channels/:channelID", SpecificChannelHandler.delete);
        this.app.post("/v1/channels/:channelID", SpecificChannelHandler.post);
        this.app.patch("/v1/channels/:channelID", SpecificChannelHandler.patch);
    
        // /v1/channels/:channelID/members
        this.app.delete("/v1/channels/:channelID/members", MembersHandler.delete);
        this.app.post("/v1/channels/:channelID/members", MembersHandler.post);

        // /v1/messages/:messageID
        this.app.patch("/v1/messages/:messageID", GetMessage, IsCreator, SpecificMessageHandler.patch);
        this.app.delete("/v1/messages/:messageID", GetMessage, IsCreator, SpecificMessageHandler.delete);
    }

    private initializeErrorHandling() {
        this.app.use(errorMiddleware);

        // TODO: Try-catch any errors that are uncaught
        process.on('uncaughtException', function(err) {
            logger.error(`FOUND UNCAUGHT EXCEPTION: ${err.stack}`);
        });

    }
}

export default App;
