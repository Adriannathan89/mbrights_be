import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateUserSchema = z.object({
    id: z.string(),
    password: z
        .string()
        .min(8)
        .describe('Password must be at least 8 characters long.')
        .optional(),
    username: z
        .string()
        .min(1)
        .describe('Username cannot be empty.')
        .optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
