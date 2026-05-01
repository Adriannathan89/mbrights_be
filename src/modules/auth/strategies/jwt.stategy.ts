import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";
import { SessionPayload } from "../domain/entities/session.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
        })
    }

    async validate(payload: SessionPayload) {
        return payload;
    }
}