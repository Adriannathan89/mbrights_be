import {
    BadRequestException,
    Body,
    Controller,
    Param,
    Patch,
    Post,
} from '@nestjs/common';

import { CreateUserDto } from '../../application/dto/create-user.dto';
import { CreateUserUseCase } from '../../application/usecase/user/create-user.usecase';
import { UpdateUserUseCase } from '../../application/usecase/user/update-user.usecase';
import { User } from '../../domain/entities/user.entity';
import {
    MissingUserRoleError,
    UserAlreadyExistsError,
} from '../../domain/errors/user.errors';
import { UserNotFoundError } from '../../domain/errors/user.errors';

@Controller('user')
export class UserController {
    constructor(
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly updateUserUseCase: UpdateUserUseCase,
    ) {}

    @Post('/create')
    async createUser(@Body() userInput: CreateUserDto): Promise<User> {
        const res = await this.createUserUseCase.execute(userInput);

        if (res.isFailure()) {
            const error = res.getError();
            if (error instanceof UserAlreadyExistsError) {
                throw new BadRequestException(error.message);
            } else if (error instanceof MissingUserRoleError) {
                throw new BadRequestException(error.message);
            }
        }

        return res.getValue();
    }

    @Patch('/update/:id')
    async updateUser(
        @Param('id') id: string,
        @Body() userInput: CreateUserDto,
    ): Promise<User> {
        const res = await this.updateUserUseCase.execute({ id, ...userInput });

        if (res.isFailure()) {
            const error = res.getError();
            if (error instanceof UserNotFoundError) {
                throw new BadRequestException(error.message);
            }
        }

        return res.getValue();
    }
}
