import { Pool } from "pg";
import { Store } from "./store";
import { User } from "../models/user.model";
import { Application, ApplicationInputs } from "../models/application.model"
import { Stage, StageInputs } from "../models/stage.model";
import { logger } from "../utils/logger";
import { HttpException } from "../utils/error";
import { isEmpty } from "../utils/utils";

export default class PostgresStore implements Store {
    private dsn : string;
    private pool : Pool;

    constructor(dsn : string) {
        this.dsn = dsn;
        this.pool = new Pool({
            max: 20,
            connectionString: dsn,
            idleTimeoutMillis: 30000
        });

        // It is important you add an event listener to the pool to catch errors.
        // Just like other event emitters, if a pool emits an error event and no listeners are added
        // node will emit an uncaught error and potentially exit.
        // https://node-postgres.com/api/pool
        this.pool.on('error',(err, client) => {
            logger.error(`postgres client "${client}" encountered an error "${err}"`);
        });
    }

    // Connect creates a connection to the database
    Connect() : void {
        // Since each query checks out a client, connects to it, and releases it,
        // this function just tests whether we have a connection to Postgres
        logger.info(`testing connection to Postgres with connection string ${this.dsn}`);
        this.pool.connect((err, client, release) => {
            if (err) {
                logger.error(`error acquiring postgres client: ${err.stack}`);
                return;
            }
            const testQuery = 'SELECT COUNT(*) AS testval FROM pg_catalog.pg_tables WHERE tablename = \'users\';';
            client.query(testQuery, (err, result) => {
                release();
                if (err) {
                    logger.error(`error executing query: ${err.stack}`);
                    return;
                }
                const testval = result.rows[0].testval;
                if (testval != 1) {
                    logger.error(`error testing postgres with "${testQuery}", expected "1" but received "${testval}"`);
                    return;
                }
                logger.info(`successfully connected to Postgres, releasing client`);
            });
        });
    }

    // GetUser returns the User with the given id
    async GetUser(id : number) : Promise<User> {
        let result;
        try {
            result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        } catch (err) {
            throw new HttpException(500, `error querying from postgres: ${err}`);
        }

        const user : User = result.rows[0];
        if (isEmpty(user)) {
            throw new HttpException(400, `user with id ${id} doesn't exist`);
        }
        if (isEmpty(user.email)) {
            throw new HttpException(500, `email is missing for user with id ${id}`);
        }
        return user;
    };

    // GetUserApplications returns the applications of the user with the given id
    async GetUserApplications(id : number) : Promise<Application[]> {
        let result;
        try {
            const query = 'SELECT * FROM applications WHERE "userID" = $1'
            result = await this.pool.query(query, [id]);
        } catch (err) {
            throw new HttpException(500, `error querying from postgres: ${err}`);
        }

        const applications : Application[] = result.rows;
        return applications;
    }

    // GetApplication returns the application with the given id
    async GetApplication(id : number) : Promise<Application> {
        const query = 'SELECT * FROM applications WHERE applications.id = $1;'

        // Try querying application from DB
        let result;
        try {
            result = await this.pool.query(query, [id]);
        } catch (err) {
            throw new HttpException(500, `error querying from DB: ${err}`);
        }

        // Throw exception if the application doesn't exist
        const application : Application = result.rows[0];
        if (isEmpty(application)) {
            throw new HttpException(400, `application with id ${id} doesn't exist`);
        }
        return application;
    };

    // InsertApplication inserts a new application with the given inputs
    // and returns the newly-inserted application, complete with the DBMS-assigned ID
    async InsertApplication(userID : number, inputs : ApplicationInputs) : Promise<Application> {
        let result;
        try {
            const query = `
            INSERT INTO applications ("userID", "positionName", "positionURL", "companyName", location, status, "dateApplied", "dateReplied", "createdDate", "updatedDate")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
            `
            const now = new Date()
            // TODO: Figure out a reasonable default date for "dateReplied"
            result = await this.pool.query(
                query,
                [userID, inputs.positionName, inputs.positionURL, inputs.companyName, inputs.status, inputs.location, now, now, now, now]
            );
        } catch (err) {
            throw new HttpException(500, `error querying from postgres: ${err}`);
        }

        // TODO: handle 0 rows returned by insert
        const application : Application = result.rows[0];
        return application;
    };

    // UpdateApplication updates the application for the given id with the given inputs
    // and returns the newly-updated application
    async UpdateApplication(id : number, updates : ApplicationInputs) : Promise<Application> {
        let result;
        try {
            const query = `
            UPDATE applications
            SET
                "positionName" = $1,
                "positionURL" = $2,
                "companyName" = $3,
                location = $4,
                status = $5,
                "dateApplied" = $6
                "dateReplied" = $7
                "updatedDate" = $8
            WHERE id = $9
            RETURNING *;
            `
            const now = new Date();
            result = await this.pool.query(
                query,
                [updates.positionName, updates.positionURL, updates.companyName, updates.location,
                 updates.status, updates.dateApplied, updates.dateReplied, now, id]
            );
        } catch (err) {
            throw new HttpException(500, `error querying from postgres: ${err}`);
        }

        // TODO: handle 0 rows returned by update
        const application : Application = result.rows[0];
        return application;
    };

    // DeleteApplication deletes the application with the given id and its associated stages
    async DeleteApplication(id : number) : Promise<void> {
        let result;
        try {
            const query = 'DELETE FROM applications WHERE id = $1;'
            result = await this.pool.query(query, [id]);
        } catch (err) {
            throw new HttpException(500, `error querying from postgres: ${err}`);
        }
        if (result.rowCount < 1) {
            throw new HttpException(500, `error deleting application from db`);
        }
    };

    // GetApplicationStages returns the stages for the application with the given id
    async GetApplicationStages(id : number) : Promise<Stage[]> {
        // Try querying results from DB
        let result;
        try {
            const query = 'SELECT * FROM stages WHERE "applicationID" = $1'
            result = await this.pool.query(query, [id]);
        } catch (err) {
            throw new HttpException(500, `error querying from postgres: ${err}`);
        }

        // TODO: handle no results
        const stages : Stage[] = result.rows;
        return stages;
    };

    // GetStage returns the stage with the given stageID, and its creator's id
    async GetStage(id : number) : Promise<[Stage, number]> {
        const query = `
        SELECT stages.*, applications."userID"
        FROM stages
        INNER JOIN applications
            ON stages."applicationID" = applications.id
        WHERE stages.id = $1;
        `
        // Try querying stage from DB
        let result;
        try {
            result = await this.pool.query(query, [id]);
        } catch (err) {
            throw new HttpException(500, `error querying from DB: ${err}`);
        }

        // Pass an exception if the stage doesn't exist
        const row = result.rows[0];
        if (isEmpty(row)) {
            throw new HttpException(400, `stage with id ${id} doesn't exist`);
        }

        // Otherwise destructure the row into userID and stage
        const {userID, ...stage} = row;
        return [stage, userID];
    };

    // InsertStage inserts a new stage with the given inputs for the specified applicationID
    // and returns the newly-inserted stage, complete with the DBMS-assigned ID
    async InsertStage(applicationID: number, inputs : StageInputs) : Promise<Stage> {
        let result;
        try {
            const query = `
            INSERT INTO stages ("applicationID", "stageType", "stageDate", "durationMins", notes, "createdDate", "updatedDate")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
            `
            const now = new Date()
            result = await this.pool.query(
                query,
                [applicationID, inputs.stageType, inputs.stageDate, inputs.durationMins, inputs.notes, now, now]
            );
        } catch (err) {
            throw new HttpException(500, `error querying from postgres: ${err}`);
        }

        // TODO: handle 0 rows returned by insert
        const stage : Stage = result.rows[0];
        return stage;
    };

    // UpdateStage updates the stage for the given id with the given inputs
    // and returns the newly-updated stage
    async UpdateStage(id : number, updates : StageInputs) : Promise<Stage> {
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
            result = await this.pool.query(
                query,
                [updates.stageType, updates.stageDate, updates.durationMins, updates.notes, now, id]
            );
        } catch (err) {
            throw new HttpException(500, `error querying from postgres: ${err}`);
        }

        // TODO: handle 0 rows returned by update
        const stage : Stage = result.rows[0];
        return stage;
    };

    // DeleteStage deletes the stage with the given id
    async DeleteStage(id : number) : Promise<void> {
        let result;
        try {
            const query = 'DELETE FROM stages WHERE id = $1;'
            result = await this.pool.query(query, [id]);
        } catch (err) {
            throw new HttpException(500, `error querying from postgres: ${err}`);
        }

        // Check if row was deleted successfully
        if (result.rowCount < 1) {
            throw new HttpException(500, `error deleting stage from db`);
        }
    };

}
