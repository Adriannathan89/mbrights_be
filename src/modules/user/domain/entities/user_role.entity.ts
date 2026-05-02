import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { BaseEntity } from "@src/shared/domain/base.entity";
import { User } from "./user.entity";
import { Role } from "./role.entity";

interface UserRoleProps {
    userId: string;
    roleId: string;
}

@Entity({ name: 'user_roles' })
@Index(['userId', 'roleId'], { unique: true })
export class UserRole extends BaseEntity<string> {
    constructor(id: string, props: UserRoleProps = { userId: '', roleId: '' }) {
        super(id);
        this.id = id;
        this.userId = props.userId;
        this.roleId = props.roleId;
    }

    @PrimaryColumn({ name: 'id' })
    id: string;

    @Column({ name: 'user_id' })
    userId: string;
    
    @Column({ name: 'role_id' })
    roleId: string;

    @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'user_id',
         referencedColumnName: 'id',
    })
    user!: User;

    @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'role_id',
        referencedColumnName: 'id',
    })
    role!: Role;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt!: Date;

    public static create(props: UserRoleProps): UserRole {
        const id = crypto.randomUUID();
        return new UserRole(id, props);
    }
}