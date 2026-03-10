export interface UserRequest {
    email: string;
    password?: string;
    fullName: string;
    birthdate: string;
    role: string;
}

export interface UpdateUser {
    id: string;
    fullName: string;
    birthdate: string;
    password: string;
}