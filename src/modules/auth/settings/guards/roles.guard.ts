import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@src/modules/user/domain/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            'roles',
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return false;
        }

        const userEntity = await this.userRepository.findOne({
            where: { id: user.id },
            relations: ['roles'],
        });

        if (!userEntity || !userEntity.roles) {
            return false;
        }

        const userRoles = userEntity.roles.map((role) => role.roleName.valueOf());
        return requiredRoles.some((role) => userRoles.includes(role));
    }
}