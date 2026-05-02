import { InjectRepository } from '@nestjs/typeorm';
import { User, userProps } from '@src/modules/user/domain/entities/user.entity';
import { MissingUserRoleError, UserAlreadyExistsError } from '@src/modules/user/domain/errors/user.errors';
import { UseCase } from '@src/shared/application/usecase.interface';
import { Result } from '@src/shared/domain/result';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from '../../dto/create-user.dto';
import { Role, RoleEnum } from '@src/modules/user/domain/entities/role.entity';

export class CreateUserUseCase implements UseCase<CreateUserDto, Result<User>> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>
    ) {}

    private hashPassword(password: string): string {
        const newPassword: string = bcrypt.hashSync(password, 10);
        return newPassword;
    }

    async execute(input: CreateUserDto): Promise<Result<User>> {
        const hashedPassword = this.hashPassword(input.password);

        const userRole = await this.roleRepository.findOne({
            where: { roleName: RoleEnum.USER },
        });

        if (!userRole) {
            return Result.fail(new MissingUserRoleError());
        }

        const roleName = userRole.roleName;

        const userProps: userProps = {
            username: input.username,
            password: hashedPassword,
        };

        const userOrError = User.create(userProps, [userRole]);

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
