export interface TaskSearchItem {
    saleId?: string;
    suid?: string;
    uprn: string;
    taskId: string;
    taskStatus: string;
    address: string;
    postcode: string;
    transactionDate: string;
    billingAuthority?: string;
    salePrice?: number;
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
        address: "1 Market Street, Bristol",
        postcode: "BS1 1AA",
        transactionDate: "2024-04-17T09:30:00Z",
    },
    {
        uprn: "100021234568",
        taskId: "T-00002",
        taskStatus: "Pending Review",
        address: "24 High Road, London",
        postcode: "N10 2DB",
        transactionDate: "2024-04-18T15:42:00Z",
    },
    {
        uprn: "100021234569",
        taskId: "T-00003",
        taskStatus: "Completed",
        address: "Flat 3, 9 Albert Square, Manchester",
        postcode: "M15 4EF",
        transactionDate: "2024-04-12T11:05:00Z",
    },
    {
        uprn: "100021234570",
        taskId: "T-00004",
        taskStatus: "Open",
        address: "77 Castle View, Edinburgh",
        postcode: "EH3 5LP",
        transactionDate: "2024-04-22T08:14:00Z",
    },
    {
        uprn: "100021234571",
        taskId: "T-00005",
        taskStatus: "In Progress",
        address: "12 Riverside Walk, Leeds",
        postcode: "LS2 7QA",
        transactionDate: "2024-04-19T13:27:00Z",
    },
    {
        uprn: "100021234572",
        taskId: "T-00006",
        taskStatus: "Open",
        address: "5 Orchard Close, Birmingham",
        postcode: "B1 2RT",
        transactionDate: "2024-04-21T10:52:00Z",
    },
    {
        uprn: "100021234573",
        taskId: "T-00007",
        taskStatus: "Pending Review",
        address: "42 Queen Street, Cardiff",
        postcode: "CF10 1AB",
        transactionDate: "2024-04-20T16:18:00Z",
    },
    {
        uprn: "100021234574",
        taskId: "T-00008",
        taskStatus: "Completed",
        address: "Flat 2, 88 King’s Road, Reading",
        postcode: "RG1 2LN",
        transactionDate: "2024-04-10T09:01:00Z",
    },
    {
        uprn: "100021234575",
        taskId: "T-00009",
        taskStatus: "On Hold",
        address: "19 Meadow Lane, Nottingham",
        postcode: "NG2 3BD",
        transactionDate: "2024-04-23T12:44:00Z",
    },
    {
        uprn: "100021234576",
        taskId: "T-00010",
        taskStatus: "Open",
        address: "31 Harbour View, Belfast",
        postcode: "BT1 3FG",
        transactionDate: "2024-04-24T07:55:00Z",
    },
];
