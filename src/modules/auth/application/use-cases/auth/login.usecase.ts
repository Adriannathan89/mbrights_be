import { LoginDto } from '@modules/auth/application/dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionPayload } from '@src/modules/auth/domain/entities/session.entity';
import { Session } from '@src/modules/auth/domain/entities/session.entity';
import { InvalidCredentialsError } from '@src/modules/auth/domain/errors/auth.errors';
import { User } from '@src/modules/user/domain/entities/user.entity';
import { UseCase } from '@src/shared/application/usecase.interface';
import { Result } from '@src/shared/domain/result';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

export class LoginUseCase implements UseCase<
    LoginDto,
    Result<{ accessToken: string; refreshToken: string }>
> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    private async validateCredentials(
        username: string,
        password: string,
    ): Promise<{ valid: boolean; user?: User }> {
        const user = await this.userRepository.findOne({ where: { username } });
        if (!user) {
            return { valid: false };
        }

        const comparedPassword = bcrypt.compareSync(password, user.password);
        return { valid: comparedPassword, user };
    }

    private storeRefreshToken(user: User, refreshToken: string): void {
        const session = Session.create({
            userId: user.id,
            username: user.username,
            refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        if (session.isOk()) {
            this.userRepository.manager.save(session.getValue());
        }
    }

    private generateAccessToken(userId: string, username: string): string {
        const payload: SessionPayload = { userId, username };
        return this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '15m',
        });
    }

    private generateRefreshToken(userId: string, username: string): string {
        const payload: SessionPayload = { userId, username };
        return this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '7d',
        });
    }

    async execute(
        input: LoginDto,
    ): Promise<Result<{ accessToken: string; refreshToken: string }>> {
        const { valid, user } = await this.validateCredentials(
            input.username,
            input.password,
        );
        if (!valid || !user) {
            return Result.fail(new InvalidCredentialsError());
        }

        const accessToken = this.generateAccessToken(user.id, user.username);
        const refreshToken = this.generateRefreshToken(user.id, user.username);

        this.storeRefreshToken(user, refreshToken);

        return Result.ok({ accessToken, refreshToken });
    }
}
