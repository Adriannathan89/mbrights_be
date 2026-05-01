import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserSchema = z.object({
    password: z
        .string()
        .min(8)
        .describe('Password must be at least 8 characters long.'),
    username: z.string().min(1).describe('Username cannot be empty.'),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
