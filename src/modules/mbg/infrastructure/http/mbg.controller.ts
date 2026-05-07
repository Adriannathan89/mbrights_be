import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@src/modules/auth/settings/guards/jwt-auth.guard';
import { Role } from '@src/modules/auth/settings/guards/roles-decorator.guard';
import { RolesGuard } from '@src/modules/auth/settings/guards/roles.guard';
import { RoleEnum } from '@src/modules/user/domain/entities/role.entity';
import type { Request } from 'express';

import { AssignVendorUserDto } from '../../application/dto/assign-vendor-user.dto';
import { ChainConfirmedDto } from '../../application/dto/chain-confirmed.dto';
import { CommitBatchDto } from '../../application/dto/commit-batch.dto';
import { CreateTransactionDto } from '../../application/dto/create-transaction.dto';
import { CreateVendorDto } from '../../application/dto/create-vendor.dto';
import { UpdateTransactionDto } from '../../application/dto/update-transaction.dto';
import { UpdateVendorDto } from '../../application/dto/update-vendor.dto';
import { MbgInternalUseCase } from '../../application/usecase/mbg-internal.usecase';
import { MbgPublicUseCase } from '../../application/usecase/mbg-public.usecase';
import { MbgTransactionsUseCase } from '../../application/usecase/mbg-transactions.usecase';
import { MbgVendorsUseCase } from '../../application/usecase/mbg-vendors.usecase';

type AuthReq = Request & { user?: { userId: string; username: string } };

@Controller('/api/v1')
export class MbgController {
    constructor(
        private readonly mbgVendorsUseCase: MbgVendorsUseCase,
        private readonly mbgTransactionsUseCase: MbgTransactionsUseCase,
        private readonly mbgPublicUseCase: MbgPublicUseCase,
        private readonly mbgInternalUseCase: MbgInternalUseCase,
    ) {}

    @Get('/vendors')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Role(RoleEnum.ADMIN.valueOf(), RoleEnum.SUPER_ADMIN.valueOf())
    async listVendors(
        @Query('page') page = 1,
        @Query('pageSize') pageSize = 20,
    ) {
        return this.mbgVendorsUseCase.listVendors(Number(page), Number(pageSize));
    }

    @Post('/vendors')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Role(RoleEnum.ADMIN.valueOf(), RoleEnum.SUPER_ADMIN.valueOf())
    async createVendor(@Body() body: CreateVendorDto) {
        return this.mbgVendorsUseCase.createVendor(body);
    }

    @Get('/vendors/:vendorId')
    @UseGuards(JwtAuthGuard)
    async getVendor(@Req() req: AuthReq, @Param('vendorId') vendorId: string) {
        return this.mbgVendorsUseCase.getVendor(req.user?.userId, vendorId);
    }

    @Patch('/vendors/:vendorId')
    @UseGuards(JwtAuthGuard)
    async updateVendor(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Body() body: UpdateVendorDto,
    ) {
        return this.mbgVendorsUseCase.updateVendor(
            req.user?.userId,
            vendorId,
            body,
        );
    }

    @Get('/vendors/:vendorId/users')
    @UseGuards(JwtAuthGuard)
    async listVendorUsers(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
    ) {
        return this.mbgVendorsUseCase.listVendorUsers(req.user?.userId, vendorId);
    }

    @Post('/vendors/:vendorId/users')
    @UseGuards(JwtAuthGuard)
    async assignVendorUser(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Body() body: AssignVendorUserDto,
    ) {
        return this.mbgVendorsUseCase.assignVendorUser(
            req.user?.userId,
            vendorId,
            body,
        );
    }

    @Delete('/vendors/:vendorId/users/:userId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    async unassignVendorUser(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Param('userId') userId: string,
    ) {
        await this.mbgVendorsUseCase.unassignVendorUser(
            req.user?.userId,
            vendorId,
            userId,
        );
    }

    @Post('/vendors/:vendorId/transactions')
    @UseGuards(JwtAuthGuard)
    async createTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Body() body: CreateTransactionDto,
    ) {
        return this.mbgTransactionsUseCase.createTx(
            req.user?.userId,
            vendorId,
            body,
        );
    }

    @Get('/vendors/:vendorId/transactions')
    @UseGuards(JwtAuthGuard)
    async listTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Query() q: Record<string, string>,
    ) {
        return this.mbgTransactionsUseCase.listTx(req.user?.userId, vendorId, q);
    }

    @Get('/vendors/:vendorId/transactions/:transactionId')
    @UseGuards(JwtAuthGuard)
    async getTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Param('transactionId') transactionId: string,
    ) {
        return this.mbgTransactionsUseCase.getTx(
            req.user?.userId,
            vendorId,
            transactionId,
        );
    }

    @Patch('/vendors/:vendorId/transactions/:transactionId')
    @UseGuards(JwtAuthGuard)
    async updateTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Param('transactionId') transactionId: string,
        @Body() body: UpdateTransactionDto,
    ) {
        return this.mbgTransactionsUseCase.updateTx(
            req.user?.userId,
            vendorId,
            transactionId,
            body,
        );
    }

    @Delete('/vendors/:vendorId/transactions/:transactionId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    async deleteTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Param('transactionId') transactionId: string,
    ) {
        await this.mbgTransactionsUseCase.deleteTx(
            req.user?.userId,
            vendorId,
            transactionId,
        );
    }

    @Post('/vendors/:vendorId/transactions/:transactionId/release')
    @UseGuards(JwtAuthGuard)
    async releaseTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Param('transactionId') transactionId: string,
    ) {
        return this.mbgTransactionsUseCase.releaseTx(
            req.user?.userId,
            vendorId,
            transactionId,
        );
    }

    @Post('/vendors/:vendorId/transactions/:transactionId/commit')
    @UseGuards(JwtAuthGuard)
    async commitTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Param('transactionId') transactionId: string,
        @Headers('idempotency-key') idempotencyKey?: string,
    ) {
        return this.mbgTransactionsUseCase.commitTx(
            req.user?.userId,
            vendorId,
            transactionId,
            idempotencyKey,
        );
    }

    @Post('/vendors/:vendorId/transactions/commit-batch')
    @UseGuards(JwtAuthGuard)
    async commitBatch(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Body() body: CommitBatchDto,
    ) {
        return this.mbgTransactionsUseCase.commitBatch(
            req.user?.userId,
            vendorId,
            body,
        );
    }

    @Get('/public/transactions')
    async publicTx(@Query() q: Record<string, string>) {
        return this.mbgPublicUseCase.publicTx(q);
    }

    @Get('/public/transactions/:transactionId')
    async publicTxDetail(@Param('transactionId') transactionId: string) {
        return this.mbgPublicUseCase.publicTxDetail(transactionId);
    }

    @Get('/public/vendors')
    async publicVendors(
        @Query('page') page = 1,
        @Query('pageSize') pageSize = 20,
    ) {
        return this.mbgPublicUseCase.publicVendors(Number(page), Number(pageSize));
    }

    @Get('/public/vendors/:vendorId/summary')
    async vendorSummary(@Param('vendorId') vendorId: string) {
        return this.mbgPublicUseCase.vendorSummary(vendorId);
    }

    @Post('/internal/webhooks/chain-confirmed')
    async chainConfirmed(
        @Headers('x-webhook-secret') secret: string,
        @Body() body: ChainConfirmedDto,
    ) {
        return this.mbgInternalUseCase.chainConfirmed(secret, body);
    }
}
