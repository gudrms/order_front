import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) { }

    async register(data: { id: string; email: string; name?: string; phoneNumber?: string; inviteCode?: string }) {
        // 이미 존재하는지 확인
        const existingUser = await this.prisma.user.findUnique({
            where: { id: data.id },
        });

        if (existingUser) {
            // 이미 존재하면 업데이트 (추가 정보 입력)
            return this.prisma.user.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    phoneNumber: data.phoneNumber,
                },
            });
        }

        // 유저 생성
        const newUser = await this.prisma.user.create({
            data: {
                id: data.id,
                email: data.email,
                name: data.name,
                phoneNumber: data.phoneNumber,
                role: 'OWNER',
            },
        });

        // 초대 코드가 있으면 매장 연결
        if (data.inviteCode) {
            const store = await this.prisma.store.findUnique({
                where: { inviteCode: data.inviteCode },
            });

            if (store) {
                await this.prisma.store.update({
                    where: { id: store.id },
                    data: {
                        ownerId: newUser.id,
                        inviteCode: null, // 코드 사용 후 파기 (재사용 방지)
                    },
                });
            }
        }

        return newUser;
    }
}
