import { z } from 'zod';
import { ENUM_USER_ROLE } from '../../../enums/user';

const updateUserZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    role: z
      .enum([...Object.values(ENUM_USER_ROLE)] as [string, ...string[]])
      .optional(),
  }),
});

export const UserValidation = {
  updateUserZodSchema,
};
