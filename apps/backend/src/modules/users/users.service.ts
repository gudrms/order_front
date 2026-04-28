import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/create-address.dto';

export interface AuthenticatedUser {
    id: string;
    email?: string | null;
    userMetadata?: {
        full_name?: string;
        name?: string;
        phone?: string;
        phone_number?: string;
    } | null;
}

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    private async ensureUser(user: AuthenticatedUser) {
        if (!user?.id) {
            throw new BadRequestException('인증된 사용자 정보가 필요합니다.');
        }

        const metadata = user.userMetadata || {};

        return this.prisma.user.upsert({
            where: { id: user.id },
            update: {
                email: user.email || `${user.id}@supabase.local`,
                name: metadata.full_name || metadata.name,
                phoneNumber: metadata.phone || metadata.phone_number,
            },
            create: {
                id: user.id,
                email: user.email || `${user.id}@supabase.local`,
                name: metadata.full_name || metadata.name,
                phoneNumber: metadata.phone || metadata.phone_number,
                role: 'USER',
            },
        });
    }

    async getAddresses(userId: string) {
        return this.prisma.userAddress.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' },
                { updatedAt: 'desc' },
            ],
        });
    }

    async createAddress(user: AuthenticatedUser, dto: CreateAddressDto) {
        await this.ensureUser(user);

        return this.prisma.$transaction(async (tx) => {
            const addressCount = await tx.userAddress.count({
                where: { userId: user.id },
            });
            const isDefault = dto.isDefault ?? addressCount === 0;

            if (isDefault) {
                await tx.userAddress.updateMany({
                    where: { userId: user.id, isDefault: true },
                    data: { isDefault: false },
                });
            }

            return tx.userAddress.create({
                data: {
                    userId: user.id,
                    ...dto,
                    isDefault,
                },
            });
        });
    }

    async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
        await this.assertOwnsAddress(userId, addressId);

        return this.prisma.$transaction(async (tx) => {
            if (dto.isDefault) {
                await tx.userAddress.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            }

            return tx.userAddress.update({
                where: { id: addressId },
                data: dto,
            });
        });
    }

    async setDefaultAddress(userId: string, addressId: string) {
        await this.assertOwnsAddress(userId, addressId);

        return this.prisma.$transaction(async (tx) => {
            await tx.userAddress.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });

            return tx.userAddress.update({
                where: { id: addressId },
                data: { isDefault: true },
            });
        });
    }

    async deleteAddress(userId: string, addressId: string) {
        const address = await this.assertOwnsAddress(userId, addressId);

        return this.prisma.$transaction(async (tx) => {
            const deleted = await tx.userAddress.delete({
                where: { id: addressId },
            });

            if (address.isDefault) {
                const nextDefault = await tx.userAddress.findFirst({
                    where: { userId },
                    orderBy: { updatedAt: 'desc' },
                });

                if (nextDefault) {
                    await tx.userAddress.update({
                        where: { id: nextDefault.id },
                        data: { isDefault: true },
                    });
                }
            }

            return deleted;
        });
    }

    private async assertOwnsAddress(userId: string, addressId: string) {
        const address = await this.prisma.userAddress.findUnique({
            where: { id: addressId },
        });

        if (!address || address.userId !== userId) {
            throw new NotFoundException('주소를 찾을 수 없습니다.');
        }

        return address;
    }

    async getFavorites(userId: string) {
        return this.prisma.userFavorite.findMany({
            where: { userId },
            include: {
                menu: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addFavorite(userId: string, menuId: string) {
        const existing = await this.prisma.userFavorite.findUnique({
            where: {
                userId_menuId: {
                    userId,
                    menuId,
                },
            },
        });

        if (existing) {
            return existing;
        }

        return this.prisma.userFavorite.create({
            data: {
                userId,
                menuId,
            },
        });
    }

    async removeFavorite(userId: string, menuId: string) {
        return this.prisma.userFavorite.delete({
            where: {
                userId_menuId: {
                    userId,
                    menuId,
                },
            },
        });
    }
}
