import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../user/domain/entities/user.entity';
import { LoginUseCase } from './application/use-cases/auth/login.usecase';
import { LogoutUseCase } from './application/use-cases/auth/logout.usecase';
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token.usecase';
import { Session } from './domain/entities/session.entity';
import { AuthController } from './infrastructure/http/auth.controller';
import { JwtStrategy } from './settings/strategies/jwt.stategy';
import { RefreshStrategy } from './settings/strategies/refresh.strategy';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({}),
        TypeOrmModule.forFeature([Session, User]),
    ],
    controllers: [AuthController],
    providers: [
        LoginUseCase,
        LogoutUseCase,
        RefreshTokenUseCase,
        JwtStrategy,
        RefreshStrategy,
    ],
})
export class AuthModule {}
