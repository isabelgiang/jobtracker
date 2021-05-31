import { HttpException } from "../utils/error";
import { isEmpty } from "../utils/utils";

// Stage is an interface for the fields of a stage in the DB
export interface Stage {
    id: bigint;
    applicationID: bigint;
    stageType: string;
    stageDate: number;
    durationMins: number;
    notes?: string;
    createdDate: Date;
    updatedDate: Date;
}

// StageInputs is an interface for the user-provided fields of a stage
export interface StageInputs {
    stageType: string;
    stageDate: Date;
    durationMins: number;
    notes?: string;
}

enum StageTypes {
    TAKE_HOME = 'Take Home',
    ONLINE_ASSESSMENT = 'Online Assessment',
    PHONE = 'Phone Screen',
    ONSITE = 'Onsite',
    TEAM_MATCHING = 'Team Matching'
}

export function ToStageInputs(body : any) : StageInputs {
    // Check for empty request values
    if (isEmpty(body)) {
        throw new HttpException(400, 'request body must not be empty')
    }
    if (isEmpty(body.stageType)) {
        throw new HttpException(400, 'stageType must not be empty')
    }
    if (isEmpty(body.stageDate)) {
        throw new HttpException(400, 'stageDate must not be empty')
    }
    if (isEmpty(body.durationMins)) {
        throw new HttpException(400, 'durationMins must not be empty')
    }

    // Check for incorrect request values
    // This snippet is used to validate enum keys, not enum values
    // TODO: remove after deciding what type of value to store
    /*if (!(body.stageType in StageTypes)) {
        throw new HttpException(400, 'invalid stage type');
    }*/
    if (!Object.values(StageTypes).includes(body.stageType)) {
        throw new HttpException(400, 'invalid stageType');
    }
    const stageDate = new Date(body.stageDate);
    if (stageDate.toString() === "Invalid Date") {
        throw new HttpException(400, 'stageDate has an invalid date format');
    }
    if (!Number.isInteger(body.durationMins)) {
        throw new HttpException(400, 'durationMins must be an integer');
    }
    if (body.durationMins < 1) {
        throw new HttpException(400, 'durationMins must be positive');
    }
    if (body.notes.length > 4000) {
        throw new HttpException(400, 'notes cannot exceed 4000 characters');
    }

    const stageInputs : StageInputs = {
        stageType: body.stageType,
        stageDate: stageDate,
        durationMins: body.durationMins,
        notes: body.notes
    }
    return stageInputs;
}
