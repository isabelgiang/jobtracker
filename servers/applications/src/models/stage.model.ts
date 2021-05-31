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
