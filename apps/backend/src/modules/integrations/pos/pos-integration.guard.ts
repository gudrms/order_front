import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class PosIntegrationGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const expectedKey = this.configService.get<string>('POS_INTEGRATION_API_KEY');
        if (!expectedKey) {
            throw new UnauthorizedException('POS integration API key is not configured');
        }

        const request = context.switchToHttp().getRequest();
        const providedKey = this.getHeaderValue(request.headers?.['x-pos-api-key']);
        if (!providedKey || !this.matches(providedKey, expectedKey)) {
            throw new UnauthorizedException('Invalid POS integration API key');
        }

        return true;
    }

    private getHeaderValue(value: string | string[] | undefined) {
        return Array.isArray(value) ? value[0] : value;
    }

    private matches(providedKey: string, expectedKey: string) {
        const provided = Buffer.from(providedKey);
        const expected = Buffer.from(expectedKey);
        return provided.length === expected.length && timingSafeEqual(provided, expected);
    }
}
