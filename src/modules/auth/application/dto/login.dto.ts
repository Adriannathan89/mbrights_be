import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginSchema = z.object({
    username: z.string().min(1).describe('Username cannot be empty.'),
    password: z
        .string()
        .min(8)
        .describe('Password must be at least 8 characters long.'),
});

export class LoginDto extends createZodDto(LoginSchema) {}
