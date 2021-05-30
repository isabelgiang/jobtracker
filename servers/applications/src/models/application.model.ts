export interface Application {
    applicationID: bigint;
    userID: bigint;
    positionID: bigint;
    status: string;
    dateApplied?: number;
    dateReplied?: number;
}
