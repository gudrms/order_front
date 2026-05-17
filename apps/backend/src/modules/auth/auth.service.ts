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

        return this.prisma.$transaction(async (tx) => {
            const existingUser = await tx.user.findUnique({
                where: { id: data.id },
            });

            return existingUser
                ? await tx.user.update({
                    where: { id: data.id },
                    data: {
                        email,
                        name: data.name || undefined,
                        phoneNumber: data.phoneNumber || undefined,
                    },
                })
                : await tx.user.create({
                    data: {
                        id: data.id,
                        email,
                        name: data.name || undefined,
                        phoneNumber: data.phoneNumber || undefined,
                        role: 'USER',
                    },
                });
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
