import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from '@src/modules/auth/domain/entities/session.entity';
import {
    RefreshTokenExpiredError,
    RefreshTokenNotFoundError,
} from '@src/modules/auth/domain/errors/auth.errors';
import { UseCase } from '@src/shared/application/usecase.interface';
import { Result } from '@src/shared/domain/result';
import { Repository } from 'typeorm';

export class RefreshTokenUseCase implements UseCase<
    string,
    Result<{ accessToken: string }>
> {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        readonly jwtService: JwtService,
    ) {}

    async execute(
        refreshToken: string,
    ): Promise<Result<{ accessToken: string }>> {
        const session = await this.sessionRepository.findOne({
            where: { refreshToken },
        });

        if (!session) {
            return Result.fail(new RefreshTokenNotFoundError());
        } else if (session.expiresAt < new Date()) {
            await this.sessionRepository.remove(session);
            return Result.fail(new RefreshTokenExpiredError());
        }

        const accessToken = this.jwtService.sign(
            { userId: session.userId, username: session.username },
            {
                secret: process.env.JWT_SECRET,
                expiresIn: '15m',
            },
        );

        return Result.ok({ accessToken });
    }
}
