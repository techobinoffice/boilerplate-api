import config from '../../../config';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { logger } from '../../../shared/logger';
import { User } from './user.model';

// creates the first super admin so the admin only routes are reachable on a fresh database
const seedSuperAdmin = async (): Promise<void> => {
  const { email, password } = config.super_admin;
  if (!email || !password) {
    return;
  }

  const isSuperAdminExist = await User.exists({
    role: ENUM_USER_ROLE.SUPER_ADMIN,
  });
  if (isSuperAdminExist) {
    return;
  }

  await User.create({
    name: 'Super Admin',
    email,
    password,
    role: ENUM_USER_ROLE.SUPER_ADMIN,
  });
  logger.info(`Super admin created: ${email}`);
};

export default seedSuperAdmin;
