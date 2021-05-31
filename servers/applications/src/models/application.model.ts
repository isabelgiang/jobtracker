export interface Application {
    id: bigint;
    userID: bigint;
    positionName: string;
    positionURL?: string;
    companyName: string;
    location: string;
    status: string;
    dateApplied?: number;
    dateReplied?: number;
    createdDate: number;
    updatedDate: number;
}

export interface ApplicationInputs {
    positionName: string;
    positionURL?: string;
    companyName: string;
    location: string;
    status: string;
    dateApplied?: number;
    dateReplied?: number;
}
