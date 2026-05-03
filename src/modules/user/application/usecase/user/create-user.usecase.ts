import { InjectRepository } from '@nestjs/typeorm';
import { Role, RoleEnum } from '@src/modules/user/domain/entities/role.entity';
import { User, userProps } from '@src/modules/user/domain/entities/user.entity';
import { UserRole } from '@src/modules/user/domain/entities/user_role.entity';
import {
    MissingUserRoleError,
    UserAlreadyExistsError,
} from '@src/modules/user/domain/errors/user.errors';
import { UseCase } from '@src/shared/application/usecase.interface';
import { Result } from '@src/shared/domain/result';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from '../../dto/create-user.dto';

export class CreateUserUseCase implements UseCase<CreateUserDto, Result<User>> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(UserRole)
        private readonly userRoleRepository: Repository<UserRole>,
    ) {}

    private hashPassword(password: string): string {
        const newPassword: string = bcrypt.hashSync(password, 10);
        return newPassword;
    }

    private createNewUserRole(
        userId: string,
        roleId: string,
    ): Result<UserRole> {
        const userRole = UserRole.create({ userId, roleId });

        return Result.ok(userRole);
    }

    async execute(input: CreateUserDto): Promise<Result<User>> {
        const hashedPassword = this.hashPassword(input.password);

        const userRole = await this.roleRepository.findOne({
            where: { roleName: RoleEnum.USER },
        });

        if (!userRole) {
            return Result.fail(new MissingUserRoleError());
        }

        const userProps: userProps = {
            username: input.username,
            password: hashedPassword,
        };

        const userOrError = User.create(userProps);

        if (!userOrError.isOk()) {
            return Result.fail(userOrError.getError());
        }
        const user = userOrError.getValue();

        const existingUser = await this.userRepository.findOne({
            where: { username: user.username },
        });

        if (existingUser) {
            return Result.fail(new UserAlreadyExistsError(user.username));
        }

        const userRoleOrError = this.createNewUserRole(user.id, userRole.id);

        if (!userRoleOrError.isOk()) {
            return Result.fail(userRoleOrError.getError());
        }
        const userRoleEntity = userRoleOrError.getValue();

        await this.userRepository.save(user);
        await this.userRoleRepository.save(userRoleEntity);
        return Result.ok(user);
    }
}
