import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) { }

    async register(data: { id: string; email: string; name?: string }) {
        // 이미 존재하는지 확인
        const existingUser = await this.prisma.user.findUnique({
            where: { id: data.id },
        });

        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        // 유저 생성
        return this.prisma.user.create({
            data: {
                id: data.id,
                email: data.email,
                name: data.name,
                role: 'OWNER', // 기본적으로 사장님으로 가입 (나중에 수정 가능)
            },
        });
    }
}
