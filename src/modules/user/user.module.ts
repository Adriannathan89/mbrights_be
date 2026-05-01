import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateUserUseCase } from './application/usecase/user/create-user.usecase';
import { UpdateUserUseCase } from './application/usecase/user/update-user.usecase';
import { User } from './domain/entities/user.entity';
import { UserController } from './infrastructure/http/user.controller';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [UserController],
    providers: [CreateUserUseCase, UpdateUserUseCase],
})
export class UserModule {}
