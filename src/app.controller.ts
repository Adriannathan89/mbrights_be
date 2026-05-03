import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from './modules/auth/settings/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/settings/guards/roles.guard';
import { Role } from './modules/auth/settings/guards/roles-decorator.guard';
import { RoleEnum } from './modules/user/domain/entities/role.entity';

@Controller('/health')
export class AppController {
    @Get('')
    getHealth() {
        return { status: 'OK' };
    }

    @Get('/guard')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Role(RoleEnum.USER.valueOf())
    getHealthGuard() {
        return { status: 'OK' };
    }
}
