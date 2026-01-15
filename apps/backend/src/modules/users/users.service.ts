import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async getAddresses(userId: string) {
        return this.prisma.userAddress.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createAddress(userId: string, dto: CreateAddressDto) {
        // 만약 기본 배달지로 설정했다면, 기존 기본 배달지 해제
        if (dto.isDefault) {
            await this.prisma.userAddress.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        return this.prisma.userAddress.create({
            data: {
                userId,
                ...dto,
            },
        });
    }

    async deleteAddress(userId: string, addressId: string) {
        const address = await this.prisma.userAddress.findUnique({
            where: { id: addressId },
        });

        if (!address) {
            throw new NotFoundException('Address not found');
        }

        if (address.userId !== userId) {
            throw new NotFoundException('Address not found'); // 보안상 Not Found로 처리
        }

        return this.prisma.userAddress.delete({
            where: { id: addressId },
        });
    }

    async getFavorites(userId: string) {
        return this.prisma.userFavorite.findMany({
            where: { userId },
            include: {
                menu: true, // 메뉴 정보 함께 조회
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addFavorite(userId: string, menuId: string) {
        // 이미 찜했는지 확인
        const existing = await this.prisma.userFavorite.findUnique({
            where: {
                userId_menuId: {
                    userId,
                    menuId,
                },
            },
        });

        if (existing) {
            return existing; // 이미 있으면 그대로 반환
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
