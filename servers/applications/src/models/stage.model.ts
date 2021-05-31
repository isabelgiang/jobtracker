// Stage is an interface for the fields of a stage in the DB
export interface Stage {
    id: bigint;
    applicationID: bigint;
    stageType: string;
    stageDate: number;
    durationMins: number;
    notes?: string;
    createdDate: number;
    updatedDate: number;
}

// StageInputs is an interface for the user-provided fields of a stage
export interface StageInputs {
    stageType: string;
    stageDate: number;
    durationMins: number;
    notes?: string;
}
