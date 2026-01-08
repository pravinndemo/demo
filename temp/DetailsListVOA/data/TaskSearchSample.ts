export interface TaskSearchItem {
    saleId?: string;
    uprn: string;
    taskId: string;
    taskStatus: string;
    caseAssignedTo: string;
    address: string;
    postcode: string;
    transactionDate: string;
    source: string;
    billingAuthority?: string;
    salesPrice?: number;
    ratio?: number;
    dwellingType?: string;
    flaggedForReview?: boolean;
    reviewFlags?: string[];
    outlierRatio?: number;
    overallFlag?: string;
    summaryFlags?: string[];
    assignedTo?: string[] | string;
    assignedDate?: string;
    taskCompletedDate?: string;
    qcAssignedTo?: string[] | string;
    qcAssignedDate?: string;
    qcCompletedDate?: string;
}

export interface TaskSearchResponse {
    items: TaskSearchItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    filters?: Record<string, string | string[]>;
}

export const SAMPLE_TASK_RESULTS: TaskSearchItem[] = [
    {
        uprn: "100021234567",
        taskId: "T-00001",
        taskStatus: "Open",
        caseAssignedTo: "Jamie Reid",
        address: "1 Market Street, Bristol",
        postcode: "BS1 1AA",
        transactionDate: "2024-04-17T09:30:00Z",
        source: "Ratepayer Portal",
    },
    {
        uprn: "100021234568",
        taskId: "T-00002",
        taskStatus: "Pending Review",
        caseAssignedTo: "Priya Singh",
        address: "24 High Road, London",
        postcode: "N10 2DB",
        transactionDate: "2024-04-18T15:42:00Z",
        source: "Internal Referral",
    },
    {
        uprn: "100021234569",
        taskId: "T-00003",
        taskStatus: "Completed",
        caseAssignedTo: "Lee Carter",
        address: "Flat 3, 9 Albert Square, Manchester",
        postcode: "M15 4EF",
        transactionDate: "2024-04-12T11:05:00Z",
        source: "Bulk Import",
    },
    {
        uprn: "100021234570",
        taskId: "T-00004",
        taskStatus: "Open",
        caseAssignedTo: "Alex Morgan",
        address: "77 Castle View, Edinburgh",
        postcode: "EH3 5LP",
        transactionDate: "2024-04-22T08:14:00Z",
        source: "Ratepayer Portal",
    },
    {
        uprn: "100021234571",
        taskId: "T-00005",
        taskStatus: "In Progress",
        caseAssignedTo: "Hannah Walsh",
        address: "12 Riverside Walk, Leeds",
        postcode: "LS2 7QA",
        transactionDate: "2024-04-19T13:27:00Z",
        source: "Agent Submission",
    },
    {
        uprn: "100021234572",
        taskId: "T-00006",
        taskStatus: "Open",
        caseAssignedTo: "Samir Patel",
        address: "5 Orchard Close, Birmingham",
        postcode: "B1 2RT",
        transactionDate: "2024-04-21T10:52:00Z",
        source: "Bulk Import",
    },
    {
        uprn: "100021234573",
        taskId: "T-00007",
        taskStatus: "Pending Review",
        caseAssignedTo: "Rebecca Chen",
        address: "42 Queen Street, Cardiff",
        postcode: "CF10 1AB",
        transactionDate: "2024-04-20T16:18:00Z",
        source: "Internal Referral",
    },
    {
        uprn: "100021234574",
        taskId: "T-00008",
        taskStatus: "Completed",
        caseAssignedTo: "Oliver Grant",
        address: "Flat 2, 88 King’s Road, Reading",
        postcode: "RG1 2LN",
        transactionDate: "2024-04-10T09:01:00Z",
        source: "Ratepayer Portal",
    },
    {
        uprn: "100021234575",
        taskId: "T-00009",
        taskStatus: "On Hold",
        caseAssignedTo: "Maria Gomez",
        address: "19 Meadow Lane, Nottingham",
        postcode: "NG2 3BD",
        transactionDate: "2024-04-23T12:44:00Z",
        source: "Agent Submission",
    },
    {
        uprn: "100021234576",
        taskId: "T-00010",
        taskStatus: "Open",
        caseAssignedTo: "Liam O’Connor",
        address: "31 Harbour View, Belfast",
        postcode: "BT1 3FG",
        transactionDate: "2024-04-24T07:55:00Z",
        source: "Ratepayer Portal",
    },
];
