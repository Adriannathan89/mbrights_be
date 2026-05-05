import { User } from '@modules/user/domain/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { Vendor } from './vendor.entity';

export enum VendorScopedRole {
    VENDOR_ADMIN = 'VENDOR_ADMIN',
    VENDOR_MEMBER = 'VENDOR_MEMBER',
    AUDITOR = 'AUDITOR',
}

@Entity({ name: 'vendor_memberships' })
@Index(['vendorId', 'userId'], { unique: true })
export class VendorMembership {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'vendor_id' })
    vendorId!: string;

    @Column({ name: 'user_id' })
    userId!: string;

    @Column({ type: 'enum', enum: VendorScopedRole })
    role!: VendorScopedRole;

    @CreateDateColumn({ name: 'joined_at', type: 'timestamp' })
    joinedAt!: Date;

    @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'vendor_id' })
    vendor!: Vendor;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;
}
