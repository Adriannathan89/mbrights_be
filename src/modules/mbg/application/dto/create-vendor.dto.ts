export class CreateVendorDto {
    name: string;
    externalRef?: string;
    metadata?: Record<string, unknown>;
}
