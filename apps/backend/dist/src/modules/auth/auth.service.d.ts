import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    register(data: {
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
}
