import { HttpException } from "../utils/error"
import { isEmpty } from "../utils/utils";

export interface Application {
    id: number;
    userID: number;
    positionName: string;
    positionURL?: string;
    companyName: string;
    location: string;
    status: string;
    dateApplied?: Date;
    dateReplied?: Date;
    createdDate: Date;
    updatedDate: Date;
}

export interface ApplicationInputs {
    positionName: string;
    positionURL?: string;
    companyName: string;
    location: string;
    status: string;
    dateApplied?: Date;
    dateReplied?: Date;
}

enum ApplicationStatuses {
    APPLIED = "Applied",
    INTERVIEWING = "Interviewing",
    WITHDREW = "Withdrew",
    OFFER = "Offer",
    REJECTED = "Rejected",
    GHOSTED = "Ghosted"
}

export function ToApplicationInputs(body : any) : ApplicationInputs {
    // Check for empty request values
    if (isEmpty(body)) {
        throw new HttpException(400, 'request body must not be empty')
    }
    if (isEmpty(body.positionName)) {
        throw new HttpException(400, 'positionName must not be empty')
    }
    if (isEmpty(body.companyName)) {
        throw new HttpException(400, 'companyName must not be empty')
    }
    if (isEmpty(body.location)) {
        throw new HttpException(400, 'location must not be empty')
    }
    if (isEmpty(body.status)) { 
        throw new HttpException(400, 'status must not be empty')
    }
    // Check for incorrect request values
    // This snippet is used to validate enum keys, not enum values
    // TODO: remove after deciding what type of value to store
    /*if (!(body.ApplicationType in ApplicationTypes)) {
        throw new HttpException(400, 'invalid Application type');
    }*/
    if (!Object.values(ApplicationStatuses).includes(body.status)) {
        throw new HttpException(400, 'invalid status');
    }
    // TODO: Check if positionURL is a valid URL 

    if (body.notes !== undefined) {
        // Convert null to undefined
        if (body.notes === null) {
            body.notes = undefined;
        }
        // Handle various string inputs
        else if (typeof body.notes === "string") {
            if (body.notes.length > 4000) {
                throw new HttpException(400, 'notes cannot exceed 4000 characters');
            }
            // Convert empty or whitespace-only notes to undefined
            else if (!body.notes.trim()) {
                body.notes = undefined;
            } else {
                body.notes = body.notes.trim()
            }
        }
        // If notes are not undefined, null, or string, throw an HttpException
        else {
            throw new HttpException(400, 'notes should be a string');
        }
    }
    
    if (body.positionURL) {

    }
    const inputs : ApplicationInputs = {
        positionName: body.positionName,
        companyName: body.companyName,
        location: body.location,
        status: body.status
    }

    if (!isEmpty(body.positionURL)) {
        inputs.positionURL = body.positionURL;
    }
    if (!isEmpty(body.dateReplied)) {
        inputs.dateReplied = body.dateReplied;
    }
    if (!isEmpty(body.dateApplied)) {
        inputs.dateApplied = body.dateApplied;
    }
    return inputs;
}
