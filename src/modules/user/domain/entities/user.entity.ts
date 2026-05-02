import { BaseEntity } from '@src/shared/domain/base.entity';
import { Result } from '@src/shared/domain/result';
import { randomUUID } from 'crypto';
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';

import { UserRole } from './user_role.entity';

export interface userProps {
    username: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
}

@Entity({ name: 'users' })
export class User extends BaseEntity<string> implements userProps {
    constructor(id: string, props: userProps = { username: '', password: '' }) {
        super(id);

        this.id = id!;
        this.username = props.username;
        this.password = props.password;
    }

    @PrimaryColumn({ name: 'id' })
    readonly id: string;

    @Column({ name: 'username', unique: true })
    username: string;

    @Column({ name: 'password' })
    password: string;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updatedAt!: Date;

    @OneToMany(() => UserRole, (userRole) => userRole.user)
    userRoles?: UserRole[];

    public static create(props: userProps): Result<User> {
        const id = randomUUID();
        return Result.ok(new User(id, props));
    }

    public static reconstruct(id: string, props: userProps): User {
        return new User(id, props);
    }
}
