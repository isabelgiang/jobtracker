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
