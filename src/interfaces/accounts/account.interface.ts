import type { Teacher } from "./teacher.interface";
import type { UserRequest } from "./users.interface";

export interface Users {
    id: string;
    role: string;
    fullName: string;
    email: string;
    birthdate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    teacher: Teacher
}

export interface AccountRequest {
    user: UserRequest,
    teacher?: Teacher
}

export interface AccountUpdate {
    id: string,
    fullName: string,
    birthdate: Date,
    password: string,
    teacher: Teacher
}
