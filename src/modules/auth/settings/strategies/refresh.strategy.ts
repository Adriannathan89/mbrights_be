import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';

import { SessionPayload } from '../../domain/entities/session.entity';

interface RefreshRequestBody {
    refreshToken: string;
}

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
            secretOrKey: process.env.JWT_REFRESH_SECRET,
            passReqToCallback: true,
        } as StrategyOptionsWithRequest);
    }

    validate(req: Request, payload: SessionPayload) {
        const body = req.body as RefreshRequestBody;

        return {
            ...payload,
            refreshToken: body.refreshToken,
        };
    }
}
