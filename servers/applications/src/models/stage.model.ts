export interface Stage {
    id: bigint;
    applicationID: bigint;
    userID: bigint;  // This field is not in the DB table, but required for authorization
    stageType: string;
    stageDate: number;
    durationMins: number;
    notes?: string;
    createdDate: number;
    updatedDate: number;
}
