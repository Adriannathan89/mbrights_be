import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '@src/modules/auth/settings/guards/roles.guard';
import { User } from '@src/modules/user/domain/entities/user.entity';

import { MbgAuthzService } from './application/mbg-authz.service';
import { MbgInternalUseCase } from './application/usecase/mbg-internal.usecase';
import { MbgPublicUseCase } from './application/usecase/mbg-public.usecase';
import { MbgTransactionsUseCase } from './application/usecase/mbg-transactions.usecase';
import { MbgVendorsUseCase } from './application/usecase/mbg-vendors.usecase';
import { CommitIdempotencyKey } from './domain/entities/commit-idempotency.entity';
import { VendorTransaction } from './domain/entities/transaction.entity';
import { Vendor } from './domain/entities/vendor.entity';
import { VendorMembership } from './domain/entities/vendor-membership.entity';
import { MbgController } from './infrastructure/http/mbg.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Vendor,
            VendorMembership,
            VendorTransaction,
            CommitIdempotencyKey,
        ]),
    ],
    controllers: [MbgController],
    providers: [
        MbgAuthzService,
        MbgVendorsUseCase,
        MbgTransactionsUseCase,
        MbgPublicUseCase,
        MbgInternalUseCase,
        RolesGuard,
    ],
})
export class MbgModule {}
