import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { SessionStatus } from '@prisma/client';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 테이블의 현재 활성 세션 조회
   */
  async getCurrentSession(storeId: string, tableNumber: number) {
    const session = await this.prisma.tableSession.findFirst({
      where: {
        storeId,
        tableNumber,
        status: SessionStatus.ACTIVE,
      },
      include: {
        orders: {
          include: {
            items: {
              include: {
                selectedOptions: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        guest: true,
      },
    });

    return session;
  }

  /**
   * 새 세션 시작 (첫 주문 시)
   */
  async startSession(storeId: string, tableNumber: number) {
    // 기존 활성 세션이 있는지 확인
    const existingSession = await this.getCurrentSession(storeId, tableNumber);
    if (existingSession) {
      return existingSession;
    }

    // 세션 번호 생성 (SES-YYYYMMDD-NNN)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.tableSession.count({
      where: {
        sessionNumber: {
          startsWith: `SES-${today}`,
        },
      },
    });
    const sessionNumber = `SES-${today}-${String(count + 1).padStart(3, '0')}`;

    // 새 세션 생성
    const session = await this.prisma.tableSession.create({
      data: {
        storeId,
        tableNumber,
        sessionNumber,
        guestCount: 1, // 기본값
        status: SessionStatus.ACTIVE,
        totalAmount: 0,
      },
    });

    return session;
  }

  /**
   * 세션 종료 (결제 완료)
   */
  async completeSession(sessionId: string, dto: CompleteSessionDto) {
    const session = await this.prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        orders: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new Error('Session is already completed');
    }

    // Guest 처리 (전화번호 있으면)
    let guestId = session.guestId;
    if (dto.guestPhone) {
      // Guest 조회 또는 생성
      let guest = await this.prisma.guest.findUnique({
        where: { phoneNumber: dto.guestPhone },
      });

      if (!guest) {
        // 새 Guest 생성
        guest = await this.prisma.guest.create({
          data: {
            phoneNumber: dto.guestPhone,
            name: dto.guestName,
            visitCount: 1,
            totalSpent: session.totalAmount,
            lastVisitedAt: new Date(),
          },
        });
      } else {
        // 기존 Guest 업데이트
        guest = await this.prisma.guest.update({
          where: { id: guest.id },
          data: {
            name: dto.guestName || guest.name,
            visitCount: { increment: 1 },
            totalSpent: { increment: session.totalAmount },
            lastVisitedAt: new Date(),
          },
        });
      }

      guestId = guest.id;
    }

    // Session 종료
    const completedSession = await this.prisma.tableSession.update({
      where: { id: sessionId },
      data: {
        guestId,
        guestCount: dto.guestCount,
        status: SessionStatus.COMPLETED,
        endedAt: new Date(),
      },
      include: {
        orders: true,
        guest: true,
      },
    });

    return completedSession;
  }

  /**
   * 세션 ID로 조회
   */
  async getSessionById(sessionId: string) {
    const session = await this.prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        orders: {
          include: {
            items: {
              include: {
                selectedOptions: true,
              },
            },
          },
        },
        guest: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  /**
   * 세션 총액 업데이트
   */
  async updateSessionTotal(sessionId: string, amount: number) {
    return this.prisma.tableSession.update({
      where: { id: sessionId },
      data: {
        totalAmount: { increment: amount },
      },
    });
  }
}
