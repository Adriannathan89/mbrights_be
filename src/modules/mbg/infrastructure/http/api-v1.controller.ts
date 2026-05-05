import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Headers,
    HttpCode,
    NotFoundException,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from '@src/modules/auth/domain/entities/session.entity';
import { JwtAuthGuard } from '@src/modules/auth/settings/guards/jwt-auth.guard';
import { User } from '@src/modules/user/domain/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import type { Request } from 'express';
import { In, Repository } from 'typeorm';

import { MbgAuthzService } from '../../application/mbg-authz.service';
import { CommitIdempotencyKey } from '../../domain/entities/commit-idempotency.entity';
import {
    TransactionStatus,
    TransactionType,
    VendorTransaction,
} from '../../domain/entities/transaction.entity';
import { Vendor } from '../../domain/entities/vendor.entity';
import {
    VendorMembership,
    VendorScopedRole,
} from '../../domain/entities/vendor-membership.entity';

type AuthReq = Request & { user?: { userId: string; username: string } };

@Controller('/api/v1')
export class ApiV1Controller {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        @InjectRepository(Vendor)
        private readonly vendorRepository: Repository<Vendor>,
        @InjectRepository(VendorMembership)
        private readonly membershipRepository: Repository<VendorMembership>,
        @InjectRepository(VendorTransaction)
        private readonly txRepository: Repository<VendorTransaction>,
        @InjectRepository(CommitIdempotencyKey)
        private readonly idemRepository: Repository<CommitIdempotencyKey>,
        private readonly jwtService: JwtService,
        private readonly authzService: MbgAuthzService,
    ) {}

    @Post('/auth/login')
    async login(@Body() body: { username: string; password: string }) {
        const user = await this.userRepository.findOne({
            where: { username: body.username },
        });
        if (!user || !bcrypt.compareSync(body.password, user.password)) {
            throw new BadRequestException('Invalid credentials');
        }

        const payload = { userId: user.id, username: user.username };
        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '15m',
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '7d',
        });
        await this.sessionRepository.save(
            new Session(randomUUID(), {
                userId: user.id,
                username: user.username,
                refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }),
        );

        return { accessToken, refreshToken };
    }

    @Post('/auth/logout')
    @HttpCode(204)
    async logout(@Body() body: { refreshToken: string }) {
        const session = await this.sessionRepository.findOne({
            where: { refreshToken: body.refreshToken },
        });
        if (!session) {
            throw new NotFoundException('Refresh token not found');
        }
        await this.sessionRepository.remove(session);
    }

    @Post('/auth/refresh-token')
    async refresh(@Body() body: { refreshToken: string }) {
        const session = await this.sessionRepository.findOne({
            where: { refreshToken: body.refreshToken },
        });
        if (!session) throw new NotFoundException('Refresh token not found');
        if (new Date() > session.expiresAt) {
            throw new BadRequestException('Refresh token expired');
        }

        const accessToken = this.jwtService.sign(
            { userId: session.userId, username: session.username },
            { secret: process.env.JWT_SECRET, expiresIn: '15m' },
        );
        return { accessToken };
    }

    @Get('/auth/me')
    @UseGuards(JwtAuthGuard)
    async me(@Req() req: AuthReq) {
        return this.getUserProfile(req.user?.userId);
    }

    @Post('/users')
    @UseGuards(JwtAuthGuard)
    async createUser(
        @Req() req: AuthReq,
        @Body()
        body: {
            username: string;
            password: string;
            email?: string;
            name?: string;
        },
    ) {
        const callerId = req.user?.userId;
        if (!callerId || !(await this.authzService.isPlatformAdmin(callerId))) {
            throw new ForbiddenException();
        }

        const exists = await this.userRepository.findOne({
            where: { username: body.username },
        });
        if (exists) throw new BadRequestException('User already exists');

        const user = this.userRepository.create({
            username: body.username,
            password: bcrypt.hashSync(body.password, 10),
        });
        await this.userRepository.save(user);
        return this.getUserProfile(user.id);
    }

    @Get('/users/me')
    @UseGuards(JwtAuthGuard)
    async usersMe(@Req() req: AuthReq) {
        return this.getUserProfile(req.user?.userId);
    }

    @Patch('/users/:userId')
    @UseGuards(JwtAuthGuard)
    async updateUser(
        @Req() req: AuthReq,
        @Param('userId') userId: string,
        @Body() body: { username?: string; password?: string },
    ) {
        const callerId = req.user?.userId;
        const isAdmin = callerId
            ? await this.authzService.isPlatformAdmin(callerId)
            : false;
        if (!callerId || (!isAdmin && callerId !== userId)) {
            throw new ForbiddenException();
        }

        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) throw new NotFoundException('User not found');
        if (body.username) user.username = body.username;
        if (body.password) user.password = bcrypt.hashSync(body.password, 10);
        await this.userRepository.save(user);
        return this.getUserProfile(user.id);
    }

    @Get('/vendors')
    @UseGuards(JwtAuthGuard)
    async listVendors(
        @Req() req: AuthReq,
        @Query('page') page = 1,
        @Query('pageSize') pageSize = 20,
    ) {
        const callerId = req.user?.userId;
        if (!callerId || !(await this.authzService.isPlatformAdmin(callerId))) {
            throw new ForbiddenException();
        }
        const [items, total] = await this.vendorRepository.findAndCount({
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize),
            order: { createdAt: 'DESC' },
        });
        return { items, total, page: Number(page), pageSize: Number(pageSize) };
    }

    @Post('/vendors')
    @UseGuards(JwtAuthGuard)
    async createVendor(
        @Req() req: AuthReq,
        @Body()
        body: {
            name: string;
            externalRef?: string;
            metadata?: Record<string, unknown>;
        },
    ) {
        const callerId = req.user?.userId;
        if (!callerId || !(await this.authzService.isPlatformAdmin(callerId))) {
            throw new ForbiddenException();
        }
        const vendor = this.vendorRepository.create(body);
        return this.vendorRepository.save(vendor);
    }

    @Get('/vendors/:vendorId')
    @UseGuards(JwtAuthGuard)
    async getVendor(@Req() req: AuthReq, @Param('vendorId') vendorId: string) {
        await this.assertVendorAccess(req.user?.userId, vendorId);
        return this.mustVendor(vendorId);
    }

    @Patch('/vendors/:vendorId')
    @UseGuards(JwtAuthGuard)
    async updateVendor(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Body()
        body: {
            name?: string;
            externalRef?: string;
            metadata?: Record<string, unknown>;
        },
    ) {
        await this.assertVendorAdmin(req.user?.userId, vendorId);
        const vendor = await this.mustVendor(vendorId);
        Object.assign(vendor, body);
        return this.vendorRepository.save(vendor);
    }

    @Get('/vendors/:vendorId/users')
    @UseGuards(JwtAuthGuard)
    async listVendorUsers(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
    ) {
        await this.assertVendorAdmin(req.user?.userId, vendorId);
        return this.membershipRepository.find({ where: { vendorId } });
    }

    @Post('/vendors/:vendorId/users')
    @UseGuards(JwtAuthGuard)
    async assignVendorUser(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Body() body: { userId: string; role: VendorScopedRole },
    ) {
        await this.assertVendorAdmin(req.user?.userId, vendorId);
        await this.mustVendor(vendorId);
        const user = await this.userRepository.findOne({
            where: { id: body.userId },
        });
        if (!user) throw new NotFoundException('User not found');

        let membership = await this.membershipRepository.findOne({
            where: { vendorId, userId: body.userId },
        });
        if (!membership) {
            membership = this.membershipRepository.create({
                vendorId,
                userId: body.userId,
                role: body.role,
            });
        } else {
            membership.role = body.role;
        }
        return this.membershipRepository.save(membership);
    }

    @Delete('/vendors/:vendorId/users/:userId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    async unassignVendorUser(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Param('userId') userId: string,
    ) {
        await this.assertVendorAdmin(req.user?.userId, vendorId);
        const membership = await this.membershipRepository.findOne({
            where: { vendorId, userId },
        });
        if (!membership) throw new NotFoundException('Assignment not found');
        await this.membershipRepository.remove(membership);
    }

    @Post('/vendors/:vendorId/transactions')
    @UseGuards(JwtAuthGuard)
    async createTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Body()
        body: {
            type: TransactionType;
            amount: string;
            currency: string;
            occurredAt: string;
            description?: string;
            metadata?: Record<string, unknown>;
        },
    ) {
        await this.assertVendorMember(req.user?.userId, vendorId);
        await this.mustVendor(vendorId);
        const tx = this.txRepository.create({
            ...body,
            vendorId,
            occurredAt: new Date(body.occurredAt),
            status: TransactionStatus.DRAFT,
        });
        return this.txRepository.save(tx);
    }

    @Get('/vendors/:vendorId/transactions')
    @UseGuards(JwtAuthGuard)
    async listTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Query() q: Record<string, string>,
    ) {
        await this.assertVendorAccess(req.user?.userId, vendorId);
        const where: Record<string, unknown> = { vendorId };
        if (q.status) where.status = q.status;
        const page = Number(q.page ?? 1);
        const pageSize = Math.min(Number(q.pageSize ?? 20), 100);
        const [items, total] = await this.txRepository.findAndCount({
            where,
            order: { occurredAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return { items, total, page, pageSize };
    }

    @Get('/vendors/:vendorId/transactions/:transactionId')
    @UseGuards(JwtAuthGuard)
    async getTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Param('transactionId') transactionId: string,
    ) {
        await this.assertVendorAccess(req.user?.userId, vendorId);
        return this.mustTx(vendorId, transactionId);
    }

    @Patch('/vendors/:vendorId/transactions/:transactionId')
    @UseGuards(JwtAuthGuard)
    async updateTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Param('transactionId') transactionId: string,
        @Body() body: Partial<VendorTransaction> & { occurredAt?: string },
    ) {
        await this.assertVendorMember(req.user?.userId, vendorId);
        const tx = await this.mustTx(vendorId, transactionId);
        if (tx.status !== TransactionStatus.DRAFT) {
            throw new BadRequestException(
                'Only draft transaction can be updated',
            );
        }
        if (body.occurredAt) tx.occurredAt = new Date(body.occurredAt);
        Object.assign(tx, body);
        return this.txRepository.save(tx);
    }

    @Delete('/vendors/:vendorId/transactions/:transactionId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    async deleteTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Param('transactionId') transactionId: string,
    ) {
        await this.assertVendorAdmin(req.user?.userId, vendorId);
        const tx = await this.mustTx(vendorId, transactionId);
        if (tx.status !== TransactionStatus.DRAFT) {
            throw new BadRequestException(
                'Only draft transaction can be deleted',
            );
        }
        await this.txRepository.remove(tx);
    }

    @Post('/vendors/:vendorId/transactions/:transactionId/release')
    @UseGuards(JwtAuthGuard)
    async releaseTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Param('transactionId') transactionId: string,
    ) {
        const userId = req.user?.userId;
        await this.assertVendorAdmin(userId, vendorId);
        const tx = await this.mustTx(vendorId, transactionId);
        if (tx.status !== TransactionStatus.DRAFT) {
            throw new BadRequestException(
                'Only draft transaction can be released',
            );
        }
        tx.status = TransactionStatus.RELEASED;
        tx.releasedAt = new Date();
        tx.releasedByUserId = userId;
        return this.txRepository.save(tx);
    }

    @Post('/vendors/:vendorId/transactions/:transactionId/commit')
    @UseGuards(JwtAuthGuard)
    async commitTx(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Param('transactionId') transactionId: string,
        @Headers('idempotency-key') idempotencyKey?: string,
    ) {
        await this.assertVendorAdmin(req.user?.userId, vendorId);
        const tx = await this.mustTx(vendorId, transactionId);
        if (tx.status !== TransactionStatus.RELEASED) {
            throw new BadRequestException('TRANSACTION_NOT_RELEASED');
        }
        if (idempotencyKey) {
            const existing = await this.idemRepository.findOne({
                where: { idempotencyKey },
            });
            if (existing && existing.transactionId !== tx.id) {
                throw new BadRequestException('IDEMPOTENCY_REPLAY_CONFLICT');
            }
            if (!existing) {
                await this.idemRepository.save(
                    this.idemRepository.create({
                        idempotencyKey,
                        transactionId: tx.id,
                    }),
                );
            }
        }

        tx.status = TransactionStatus.COMMIT_PENDING;
        tx.commitRequestedAt = new Date();
        tx.payloadHash = this.computePayloadHash(tx);
        await this.txRepository.save(tx);
        return {
            transactionId: tx.id,
            status: TransactionStatus.COMMIT_PENDING,
        };
    }

    @Post('/vendors/:vendorId/transactions/commit-batch')
    @UseGuards(JwtAuthGuard)
    async commitBatch(
        @Req() req: AuthReq,
        @Param('vendorId') vendorId: string,
        @Body() body: { transactionIds: string[] },
    ) {
        await this.assertVendorAdmin(req.user?.userId, vendorId);
        const txs = await this.txRepository.findBy({
            id: In(body.transactionIds),
        });
        const updated: string[] = [];
        for (const tx of txs) {
            if (
                tx.vendorId === vendorId &&
                tx.status === TransactionStatus.RELEASED
            ) {
                tx.status = TransactionStatus.COMMIT_PENDING;
                tx.commitRequestedAt = new Date();
                tx.payloadHash = this.computePayloadHash(tx);
                await this.txRepository.save(tx);
                updated.push(tx.id);
            }
        }
        return { accepted: updated };
    }

    @Get('/public/transactions')
    async publicTx(@Query() q: Record<string, string>) {
        const page = Number(q.page ?? 1);
        const pageSize = Math.min(Number(q.pageSize ?? 20), 100);
        const where: Record<string, unknown> = {
            status: TransactionStatus.COMMITTED,
        };
        if (q.vendorId) where.vendorId = q.vendorId;
        const [items, total] = await this.txRepository.findAndCount({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            order: { committedAt: 'DESC' },
        });
        return { items, total, page, pageSize };
    }

    @Get('/public/transactions/:transactionId')
    async publicTxDetail(@Param('transactionId') transactionId: string) {
        const tx = await this.txRepository.findOne({
            where: { id: transactionId, status: TransactionStatus.COMMITTED },
        });
        if (!tx) throw new NotFoundException('Transaction not found');
        return tx;
    }

    @Get('/public/vendors')
    async publicVendors(
        @Query('page') page = 1,
        @Query('pageSize') pageSize = 20,
    ) {
        const [items, total] = await this.vendorRepository.findAndCount({
            select: { id: true, name: true },
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize),
        });
        return { items, total, page: Number(page), pageSize: Number(pageSize) };
    }

    @Get('/public/vendors/:vendorId/summary')
    async vendorSummary(@Param('vendorId') vendorId: string) {
        await this.mustVendor(vendorId);
        const committed = await this.txRepository.find({
            where: { vendorId, status: TransactionStatus.COMMITTED },
            order: { committedAt: 'ASC' },
        });
        return {
            vendorId,
            committedTransactionCount: committed.length,
            firstCommittedAt: committed[0]?.committedAt ?? null,
            lastCommittedAt:
                committed[committed.length - 1]?.committedAt ?? null,
        };
    }

    @Post('/internal/webhooks/chain-confirmed')
    async chainConfirmed(
        @Headers('x-webhook-secret') secret: string,
        @Body()
        body: {
            transactionId: string;
            txHash: string;
            blockNumber: number;
            chainId?: number;
        },
    ) {
        if (
            !process.env.INTERNAL_WEBHOOK_SECRET ||
            secret !== process.env.INTERNAL_WEBHOOK_SECRET
        ) {
            throw new UnauthorizedException();
        }
        const tx = await this.txRepository.findOne({
            where: { id: body.transactionId },
        });
        if (!tx) throw new NotFoundException('Transaction not found');
        tx.status = TransactionStatus.COMMITTED;
        tx.committedAt = new Date();
        tx.chain = {
            txHash: body.txHash,
            blockNumber: body.blockNumber,
            chainId: body.chainId ?? Number(process.env.CHAIN_ID ?? 11155111),
        };
        await this.txRepository.save(tx);
        return { ok: true };
    }

    private async getUserProfile(userId?: string) {
        if (!userId) throw new UnauthorizedException();
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) throw new NotFoundException('User not found');
        const vendorMemberships = await this.membershipRepository.find({
            where: { userId },
        });
        return {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            vendorMemberships: vendorMemberships.map((m) => ({
                vendorId: m.vendorId,
                role: m.role,
                joinedAt: m.joinedAt,
            })),
        };
    }

    private async mustVendor(vendorId: string) {
        const vendor = await this.vendorRepository.findOne({
            where: { id: vendorId },
        });
        if (!vendor) throw new NotFoundException('Vendor not found');
        return vendor;
    }

    private async mustTx(vendorId: string, transactionId: string) {
        const tx = await this.txRepository.findOne({
            where: { id: transactionId, vendorId },
        });
        if (!tx) throw new NotFoundException('Transaction not found');
        return tx;
    }

    private async assertVendorAccess(
        userId: string | undefined,
        vendorId: string,
    ) {
        if (!userId) throw new UnauthorizedException();
        if (await this.authzService.isPlatformAdmin(userId)) return;
        const role = await this.authzService.getVendorRole(vendorId, userId);
        if (!role) throw new ForbiddenException();
    }

    private async assertVendorAdmin(
        userId: string | undefined,
        vendorId: string,
    ) {
        if (!userId) throw new UnauthorizedException();
        if (await this.authzService.isPlatformAdmin(userId)) return;
        const role = await this.authzService.getVendorRole(vendorId, userId);
        if (role !== VendorScopedRole.VENDOR_ADMIN)
            throw new ForbiddenException();
    }

    private async assertVendorMember(
        userId: string | undefined,
        vendorId: string,
    ) {
        if (!userId) throw new UnauthorizedException();
        if (await this.authzService.isPlatformAdmin(userId)) return;
        const role = await this.authzService.getVendorRole(vendorId, userId);
        if (!role || role === VendorScopedRole.AUDITOR)
            throw new ForbiddenException();
    }

    private computePayloadHash(tx: VendorTransaction): string {
        const serialized = JSON.stringify({
            id: tx.id,
            vendorId: tx.vendorId,
            type: tx.type,
            amount: tx.amount,
            currency: tx.currency,
            occurredAt: tx.occurredAt.toISOString(),
            description: tx.description ?? null,
            metadata: tx.metadata ?? null,
        });
        return `0x${createHash('sha256').update(serialized).digest('hex')}`;
    }
}
