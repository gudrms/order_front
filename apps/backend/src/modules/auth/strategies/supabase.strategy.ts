import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${configService.get<string>('SUPABASE_URL')}/.well-known/jwks.json`,
            }),
            algorithms: ['RS256'], // ECC keys often use RS256 or similar in JWKS context, but Supabase default is RS256 for new projects
        });
    }

    async validate(payload: any) {
        return { id: payload.sub, email: payload.email };
    }
}
