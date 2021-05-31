import express from 'express';

import { ApplicationsHandler, SpecificApplicationHandler } from "./handlers/applications";
import { StagesHandler, SpecificStageHandler } from "./handlers/stages";
import { GetUser, GetApplication, GetStage, IsCreator } from './utils/utils';
import { testPostgresConnection } from "./database";

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
    }

    private initializeMiddleware() {
        if (this.env === 'local') {
            morganBody(this.app);
        }

        this.app.use(express.json());
        this.app.use(GetUser);
        this.app.use("/v1/applications/:applicationID*", GetApplication, IsCreator);
        this.app.use("/v1/stages/:stageID", GetStage, IsCreator);
    }

    private initializeHandlers() {
        // /v1/users/:userID/applications
        this.app.get("/v1/users/:userID/applications", ApplicationsHandler.get);
        this.app.post("/v1/users/:userID/applications", ApplicationsHandler.post);
        
        // /v1/applications/:applicationID
        this.app.get("/v1/applications/:applicationID", SpecificApplicationHandler.get);
        this.app.patch("/v1/applications/:applicationID", SpecificApplicationHandler.patch);
        this.app.delete("/v1/applications/:applicationID", SpecificApplicationHandler.delete);
    
        // /v1/applications/:applicationID/stages
        this.app.get("/v1/applications/:applicationID/stages", StagesHandler.get);
        this.app.post("/v1/applications/:applicationID/stages", StagesHandler.post);

        // /v1/stages/:stageID
        this.app.get("/v1/stages/:stageID", SpecificStageHandler.get);
        this.app.patch("/v1/stages/:stageID", SpecificStageHandler.patch);
        this.app.delete("/v1/stages/:stageID",SpecificStageHandler.delete);
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
