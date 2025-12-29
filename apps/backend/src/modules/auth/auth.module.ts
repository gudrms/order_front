import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseStrategy } from './strategies/supabase.strategy';

@Module({
    imports: [
        PassportModule,
        ConfigModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, SupabaseStrategy],
    exports: [SupabaseStrategy, PassportModule],
})
export class AuthModule { }
