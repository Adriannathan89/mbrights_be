import { VendorScopedRole } from '../../domain/entities/vendor-membership.entity';

export class AssignVendorUserDto {
    userId: string;
    role: VendorScopedRole;
}
