import { Body, Controller, Get, Param, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { CreateCouponDto, IssueCouponDto, RedeemCouponDto } from './dto/coupon.dto';
import { CouponsService } from './coupons.service';

@ApiTags('Coupons')
@UseGuards(SupabaseGuard)
@ApiBearerAuth('JWT-auth')
@Controller('coupons')
export class CouponsController {
    constructor(private readonly couponsService: CouponsService) {}

    // ── 관리자 전용 ───────────────────────────────────────────────

    @Post()
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({ summary: '쿠폰 생성 (관리자)', description: '정액/정률 쿠폰 템플릿을 생성합니다.' })
    @ApiResponse({ status: 201, description: '쿠폰 생성 성공' })
    async createCoupon(
        @CurrentUser() user: { id: string },
        @Body() dto: CreateCouponDto,
    ) {
        return this.couponsService.createCoupon(user.id, dto);
    }

    @Get()
    @ApiOperation({ summary: '쿠폰 목록 조회 (관리자)' })
    async listCoupons(@CurrentUser() user: { id: string }) {
        return this.couponsService.listCoupons(user.id);
    }

    @Post(':couponId/issue')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({ summary: '쿠폰 사용자 발급 (관리자)', description: '특정 사용자에게 쿠폰을 발급합니다.' })
    @ApiParam({ name: 'couponId', description: '쿠폰 ID' })
    @ApiResponse({ status: 201, description: '발급 성공' })
    async issueCoupon(
        @CurrentUser() user: { id: string },
        @Param('couponId') couponId: string,
        @Body() dto: IssueCouponDto,
    ) {
        return this.couponsService.issueCouponToUser(user.id, couponId, dto);
    }
}

@ApiTags('Users')
@UseGuards(SupabaseGuard)
@ApiBearerAuth('JWT-auth')
@Controller('users/me/coupons')
export class UserCouponsController {
    constructor(private readonly couponsService: CouponsService) {}

    @Get()
    @ApiOperation({ summary: '내 쿠폰 전체 목록', description: '사용/만료 포함 전체 쿠폰 목록.' })
    @ApiResponse({ status: 200, description: '쿠폰 목록' })
    async getMyCoupons(@CurrentUser() user: { id: string }) {
        return this.couponsService.getMyCoupons(user.id);
    }

    @Get('available')
    @ApiOperation({ summary: '사용 가능한 내 쿠폰', description: '미사용 + 미만료 쿠폰만 반환.' })
    @ApiResponse({ status: 200, description: '사용 가능한 쿠폰 목록' })
    async getAvailableCoupons(@CurrentUser() user: { id: string }) {
        return this.couponsService.getMyAvailableCoupons(user.id);
    }

    @Post('redeem')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({ summary: '프로모 코드 등록', description: '쿠폰 코드를 입력해 내 쿠폰함에 추가합니다.' })
    @ApiResponse({ status: 201, description: '쿠폰 등록 성공' })
    @ApiResponse({ status: 400, description: '유효하지 않은 코드 또는 중복' })
    async redeemCode(
        @CurrentUser() user: { id: string },
        @Body() dto: RedeemCouponDto,
    ) {
        return this.couponsService.redeemCode(user.id, dto);
    }
}
