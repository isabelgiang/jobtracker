export interface Stage {
    stageID : bigint;
    applicationID : bigint;
    userID : bigint;  // This field is not in the DB table, but required for authorization
    stageType : string;
    stageNum : number;
    duration : number;
    stageTagIDs? : number[];
    stageDate? : number;
    stageURL? : string;
    notes? : string;
}
