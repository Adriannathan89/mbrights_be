import { InjectRepository } from "@nestjs/typeorm";
import { Session } from "@src/modules/auth/domain/entities/session.entity";
import { Repository } from "typeorm";
import { UseCase } from "@src/shared/application/usecase.interface";
import { Result } from "@src/shared/domain/result";
import { JwtService } from "@nestjs/jwt";

export class RefreshTokenUseCase implements UseCase<string, Result<{ accessToken: string }>> {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        readonly jwtService: JwtService,
    ) {}

    async execute(refreshToken: string): Promise<Result<{ accessToken: string }>> {
        const session = await this.sessionRepository.findOne({ where: { refreshToken } });
        
        if (!session || session.expiresAt < new Date()) {
            return Result.fail(new Error("Invalid or expired refresh token"));
        }

        const accessToken = this.jwtService.sign({ userId: session.userId, username: session.username }, {
            secret: process.env.JWT_SECRET,
            expiresIn: "15m",
        });
        
        return Result.ok({ accessToken });
    }
}