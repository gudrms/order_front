import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: {
        id: string;
        email: string;
        name?: string;
    }): Promise<{
        id: string;
        email: string;
        name: string | null;
        phoneNumber: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getProfile(req: any): any;
}
