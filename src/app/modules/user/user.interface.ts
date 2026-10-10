/* eslint-disable no-unused-vars */
import { HydratedDocument, Model } from 'mongoose';
import { ENUM_USER_ROLE } from '../../../enums/user';

export type IUser = {
  name: string;
  email: string;
  password: string;
  role: ENUM_USER_ROLE;
  passwordChangedAt?: Date;
};

export type IUserFilters = {
  searchTerm?: string;
  email?: string;
  role?: string;
};

export type UserModel = {
  isUserExist(email: string): Promise<HydratedDocument<IUser> | null>;
  isPasswordMatched(
    givenPassword: string,
    savedPassword: string
  ): Promise<boolean>;
} & Model<IUser>;
