import { LoginDto } from '@modules/auth/application/dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@src/modules/auth/domain/entities/user.entity';
import { InvalidCredentialsError } from '@src/modules/auth/domain/errors/user.errors';
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
    ) {}

    private async validateCredentials(
        username: string,
        password: string,
    ): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { username } });
        if (!user) {
            return false;
        }

        const comparedPassword = bcrypt.compareSync(password, user.password);
        return comparedPassword;
    }

    private generateAccessToken(username: string): string {
        // Implement your access token generation logic here, such as using JWT.
        return 'dummyAccessToken'; // Placeholder for generated access token
    }

    private generateRefreshToken(username: string): string {
        // Implement your refresh token generation logic here, such as using JWT or a random string.
        return 'dummyRefreshToken'; // Placeholder for generated refresh token
    }

    async execute(
        input: LoginDto,
    ): Promise<Result<{ accessToken: string; refreshToken: string }>> {
        if (!(await this.validateCredentials(input.username, input.password))) {
            return Result.fail(new InvalidCredentialsError());
        }

        const accessToken = this.generateAccessToken(input.username);
        const refreshToken = this.generateRefreshToken(input.username);

        return Result.ok({ accessToken, refreshToken });
    }
}
