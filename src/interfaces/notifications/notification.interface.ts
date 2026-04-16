export interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    referenceId: string;
    actionUrl: string;
    createdAt: string;
}