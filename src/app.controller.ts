import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from './modules/auth/settings/guards/jwt-auth.guard';

@Controller('/health')
export class AppController {
    @Get('')
    getHealth() {
        return { status: 'OK' };
    }

    @Get('/guard')
    @UseGuards(JwtAuthGuard)
    getHealthGuard() {
        return { status: 'OK' };
    }
}
