import PostgresStore from "./postgresstore";

const postgresUser = process.env.POSTGRES_USER || "postgres";
const postgresPassword = process.env.POSTGRES_PASSWORD || "postgres"
const postgresHost = process.env.POSTGRES_HOST || "localhost";
const postgresPort = process.env.POSTGRES_PORT || "5432";
const postgresDB = process.env.POSTGRES_DB || "postgres";
const postgresDSN = `postgres://${postgresUser}:${postgresPassword}@${postgresHost}:${postgresPort}/${postgresDB}?sslmode=disable`;

export const db = new PostgresStore(postgresDSN);
