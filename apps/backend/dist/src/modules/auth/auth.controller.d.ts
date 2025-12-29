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
        name: string | null;
        phoneNumber: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    getProfile(req: any): any;
}
