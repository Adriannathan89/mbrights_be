import { BaseEntity } from '@src/shared/domain/base.entity';
import { Result } from '@src/shared/domain/result';
import { randomUUID } from 'crypto';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Role }  from './role.entity';

export interface userProps {
    username: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
}

@Entity({ name: 'users' })
export class User extends BaseEntity<string> implements userProps {
    constructor(id: string, props: userProps = { username: '', password: ''}, Roles: Role[]) {
        super(id);

        this.id = id!;
        this.username = props.username;
        this.password = props.password;
        this.roles = Roles;
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

    @ManyToMany(() => Role, role => role.users)
    @JoinTable({
        name: 'user_roles',
        joinColumn: {
            name: 'user_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'role_id',
            referencedColumnName: 'id'
        }
    })
    roles?: Role[];

    public static create(props: userProps, roles: Role[]): Result<User> {
        const id = randomUUID();
        return Result.ok(new User(id, props, roles));
    }

    public static reconstruct(id: string, props: userProps, roles: Role[]): User {
        return new User(id, props, roles);
    }
}
