import { Body, Controller, Post } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { LoginDto } from '../../application/dto/login.dto';
import { LoginUseCase } from '../../application/use-cases/auth/login.usecase';
import { LogoutUseCase } from '../../application/use-cases/auth/logout.usecase';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.usecase';
import {
    InvalidCredentialsError,
    RefreshTokenExpiredError,
    RefreshTokenNotFoundError,
} from '../../domain/errors/auth.errors';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginUseCase: LoginUseCase,
        private readonly logoutUseCase: LogoutUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
    ) {}

    @Post('/login')
    async login(
        @Body() loginDto: LoginDto,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const res = await this.loginUseCase.execute(loginDto);

        if (res.isFailure()) {
            const error = res.getError();
            if (error instanceof InvalidCredentialsError) {
                throw new BadRequestException(error.message);
            }
        }
        return res.getValue();
    }

    @Post('/logout')
    async logout(@Body() refreshToken: string): Promise<void> {
        const res = await this.logoutUseCase.execute(refreshToken);

        if (res.isFailure()) {
            const error = res.getError();
            if (error instanceof RefreshTokenNotFoundError) {
                throw new NotFoundException(error.message);
            }
        }
    }

    @Post('/refresh-token')
    async refreshToken(
        @Body() refreshToken: string,
    ): Promise<{ accessToken: string }> {
        const res = await this.refreshTokenUseCase.execute(refreshToken);

        if (res.isFailure()) {
            const error = res.getError();
            if (error instanceof RefreshTokenNotFoundError) {
                throw new NotFoundException(error.message);
            } else if (error instanceof RefreshTokenExpiredError) {
                throw new BadRequestException(error.message);
            }
        }

        return res.getValue();
    }
}
