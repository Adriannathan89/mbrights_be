import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';

import { SessionPayload } from '../../domain/entities/session.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
        } as StrategyOptionsWithRequest);
    }

    validate(payload: SessionPayload) {
        return payload;
    }
}
