import { User } from "../models/user.model";
import { Application, ApplicationInputs } from "../models/application.model"
import { Stage, StageInputs } from "../models/stage.model";



export interface Store {
    // Connect creates a connection to the database
    Connect(dsn : string) : void;

    // GetUser returns the User with the given id
    GetUser(id : bigint) : Promise<User>;

    // GetApplication returns the application with the given id
    GetApplication(id : bigint) : Promise<Application>;

    /*
    // InsertApplication inserts a new application with the given inputs
    // and returns the newly-inserted application, complete with the DBMS-assigned ID
    InsertApplication(inputs : ApplicationInputs) : Promise<Application>;

    // UpdateApplication updates the application for the given id with the given inputs
    // and returns the newly-updated application
    UpdateApplication(id : bigint, updates : ApplicationInputs) : Promise<Application>;

    // DeleteApplication deletes the application with the given id and its associated stages
    DeleteApplication(id : bigint) : Promise<void>;
    */

    // GetApplicationStages returns the stages for the application with the given id
    GetApplicationStages(id : bigint) : Promise<Stage[]>;

    // GetStage returns the stage with the given stageID, and its creator's id
    GetStage(id : bigint) : Promise<[Stage, bigint]>;

    // InsertStage inserts a new stage with the given inputs for the specified applicationID
    // and returns the newly-inserted stage, complete with the DBMS-assigned ID
    InsertStage(applicationID: bigint, inputs : StageInputs) : Promise<Stage>;

    // UpdateStage updates the stage for the given id with the given inputs
    // and returns the newly-updated stage
    UpdateStage(id : bigint, updates : StageInputs) : Promise<Stage>;

    // DeleteStage deletes the stage with the given id
    DeleteStage(id : bigint) : Promise<void>;
}
