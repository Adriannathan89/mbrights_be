import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { SessionPayload } from "../domain/entities/session.entity";
import { ExtractJwt } from "passport-jwt";
import { Request } from "express";

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
            secretOrKey: process.env.JWT_REFRESH_SECRET,
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: SessionPayload) {
        return {
            ...payload,
            refreshToken: req.body.refreshToken,
        };
    }
}