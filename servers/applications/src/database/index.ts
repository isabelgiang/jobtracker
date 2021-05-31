import { logger } from '../utils/logger';
import { Pool } from 'pg';

const postgresUser = process.env.POSTGRES_USER || "postgres";
const postgresPassword = process.env.POSTGRES_PASSWORD || "postgres"
const postgresHost = process.env.POSTGRES_HOST || "localhost";
const postgresPort = process.env.POSTGRES_PORT || "5432";
const postgresDB = process.env.POSTGRES_DB || "postgres";
const postgresDSN = `postgres://${postgresUser}:${postgresPassword}@${postgresHost}:${postgresPort}/${postgresDB}?sslmode=disable`;


export const pgPool = new Pool({
    max: 20,
    connectionString: postgresDSN,
    idleTimeoutMillis: 30000
});
// It is important you add an event listener to the pool to catch errors.
// Just like other event emitters, if a pool emits an error event and no listeners are added
// node will emit an uncaught error and potentially exit.
// https://node-postgres.com/api/pool
pgPool.on('error',(err, client) => {
    logger.error(`postgres client "${client}" encountered an error "${err}"`);
});

// Since each query checks out a client, connects to it, and releases it,
// this function just tests whether we have a connection to Postgres
export const testPostgresConnection = () => {
    logger.info(`testing connection to Postgres with connection string ${postgresDSN}`);
    pgPool.connect((err, client, release) => {
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
