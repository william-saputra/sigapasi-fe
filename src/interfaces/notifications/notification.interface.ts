export interface Notifications {
    id: string;
    title: string;
    message: string;
    read: boolean;
    referenceId: string;
    actionUrl: string;
    createdAt: string;
}

export interface NotificationRequest {
    userId: string;
    title: string;
    message: string;
    referenceId: string;
    actionUrl: string;
}

export interface DeleteNotification {
    notificationIds: string[];
}