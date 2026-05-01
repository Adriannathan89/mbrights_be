import { UpdateUserDto } from '@modules/auth/application/dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@src/modules/auth/domain/entities/user.entity';
import { UseCase } from '@src/shared/application/usecase.interface';
import { Result } from '@src/shared/domain/result';
import { Repository } from 'typeorm';

export class UpdateUserUseCase implements UseCase<UpdateUserDto, Result<User>> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async execute(input: UpdateUserDto): Promise<Result<User>> {
        const user = await this.userRepository.findOneBy({ id: input.id });

        if (!user) {
            return Result.fail(new Error('User not found'));
        }

        if (input.username) {
            user.username = input.username;
        }

        if (input.password) {
            user.password = input.password;
        }

        await this.userRepository.save(user);

        return Result.ok(user);
    }
}
