import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '@src/modules/auth/domain/entities/session.entity';
import { Role } from '@src/modules/user/domain/entities/role.entity';
import { User } from '@src/modules/user/domain/entities/user.entity';
import { UserRole } from '@src/modules/user/domain/entities/user_role.entity';

import { MbgAuthzService } from './application/mbg-authz.service';
import { CommitIdempotencyKey } from './domain/entities/commit-idempotency.entity';
import { VendorTransaction } from './domain/entities/transaction.entity';
import { Vendor } from './domain/entities/vendor.entity';
import { VendorMembership } from './domain/entities/vendor-membership.entity';
import { ApiV1Controller } from './infrastructure/http/api-v1.controller';

@Module({
    imports: [
        JwtModule.register({}),
        TypeOrmModule.forFeature([
            User,
            Role,
            UserRole,
            Session,
            Vendor,
            VendorMembership,
            VendorTransaction,
            CommitIdempotencyKey,
        ]),
    ],
    controllers: [ApiV1Controller],
    providers: [MbgAuthzService],
})
export class MbgModule {}
