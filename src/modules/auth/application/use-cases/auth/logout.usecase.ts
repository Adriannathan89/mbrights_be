import { InjectRepository } from '@nestjs/typeorm';
import { Session } from '@src/modules/auth/domain/entities/session.entity';
import { RefreshTokenNotFoundError } from '@src/modules/auth/domain/errors/auth.errors';
import { UseCase } from '@src/shared/application/usecase.interface';
import { Result } from '@src/shared/domain/result';
import { Repository } from 'typeorm';

export class LogoutUseCase implements UseCase<string, Result<void>> {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
    ) {}

    async execute(refreshToken: string): Promise<Result<void>> {
        const session = await this.sessionRepository.findOneBy({
            refreshToken,
        });

        if (!session) {
            return Result.fail(new RefreshTokenNotFoundError());
        }

        await this.sessionRepository.remove(session);
        return Result.ok(undefined);
    }
}
