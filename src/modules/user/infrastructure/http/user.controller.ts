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
import { UserAlreadyExistsError } from '../../domain/errors/user.errors';
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
            if (res.getError() instanceof UserAlreadyExistsError) {
                throw new BadRequestException('User already exists');
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
            if (res.getError() instanceof UserNotFoundError) {
                throw new BadRequestException('User not found');
            }
        }

        return res.getValue();
    }
}
