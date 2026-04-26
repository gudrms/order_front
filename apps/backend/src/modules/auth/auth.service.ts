import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) { }

    async syncAuthenticatedUser(data: {
        id: string;
        email?: string | null;
        name?: string | null;
        phoneNumber?: string | null;
    }) {
        if (!data.id) {
            throw new BadRequestException('Authenticated user id is required');
        }

        const email = data.email || `${data.id}@supabase.local`;

        return this.register({
            id: data.id,
            email,
            name: data.name || undefined,
            phoneNumber: data.phoneNumber || undefined,
        });
    }

    async register(data: { id: string; email: string; name?: string; phoneNumber?: string; inviteCode?: string }) {
        return this.prisma.$transaction(async (tx) => {
            const store = data.inviteCode
                ? await tx.store.findUnique({ where: { inviteCode: data.inviteCode } })
                : null;

            if (data.inviteCode && !store) {
                throw new BadRequestException('Invalid or expired invite code');
            }

            const existingUser = await tx.user.findUnique({
                where: { id: data.id },
            });

            const user = existingUser
                ? await tx.user.update({
                    where: { id: data.id },
                    data: {
                        email: data.email,
                        name: data.name,
                        phoneNumber: data.phoneNumber,
                        role: store && existingUser.role !== 'ADMIN' ? 'OWNER' : existingUser.role,
                    },
                })
                : await tx.user.create({
                    data: {
                        id: data.id,
                        email: data.email,
                        name: data.name,
                        phoneNumber: data.phoneNumber,
                        role: store ? 'OWNER' : 'USER',
                    },
                });

            if (store) {
                await tx.store.update({
                    where: { id: store.id },
                    data: {
                        ownerId: user.id,
                        inviteCode: null,
                    },
                });
            }

            return user;
        });
    }

    async getProfile(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                stores: true,
            },
        });
    }
}
