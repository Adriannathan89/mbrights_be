import { User, userProps } from '@modules/auth/domain/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAlreadyExistsError } from '@src/modules/auth/domain/errors/user.errors';
import { UseCase } from '@src/shared/application/usecase.interface';
import { Result } from '@src/shared/domain/result';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from '../../dto/create-user.dto';

export class CreateUserUseCase implements UseCase<CreateUserDto, Result<User>> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    private hashPassword(password: string): string {
        const newPassword: string = bcrypt.hashSync(password, 10);
        return newPassword;
    }

    async execute(input: CreateUserDto): Promise<Result<User>> {
        const hashedPassword = this.hashPassword(input.password);

        const userProps: userProps = {
            username: input.username,
            password: hashedPassword,
        };

        const userOrError = User.create(userProps);

        if (!userOrError.isOk()) {
            return Result.fail(
                userOrError.getError() ?? 'Failed to create user',
            );
        }

        const user = userOrError.getValue();
        const existingUser = await this.userRepository.findOne({
            where: { username: user.username },
        });

        if (existingUser) {
            return Result.fail(new UserAlreadyExistsError(user.username));
        }

        await this.userRepository.save(user);
        return Result.ok(user);
    }
}
