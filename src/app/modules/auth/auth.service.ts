import httpStatus from 'http-status';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import {
  IChangePassword,
  ILoginUser,
  ILoginUserResponse,
  IRefreshTokenResponse,
  IRegisterUser,
} from './auth.interface';
import { sendEmail } from './sendResetMail';

const registerUser = async (payload: IRegisterUser): Promise<IUser | null> => {
  const { name, email, password } = payload;

  const isUserExist = await User.isUserExist(email);
  if (isUserExist) {
    throw new ApiError(httpStatus.CONFLICT, 'Email is already in use');
  }

  // role is not taken from the payload, a registered user always gets the default role
  const newUser = await User.create({ name, email, password });

  // fetch again so the password is not returned
  return await User.findById(newUser._id);
};

const loginUser = async (payload: ILoginUser): Promise<ILoginUserResponse> => {
  const { email, password } = payload;

  const isUserExist = await User.isUserExist(email);

  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }

  if (!(await User.isPasswordMatched(password, isUserExist.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password is incorrect');
  }

  //create access token & refresh token

  const { _id, role } = isUserExist;
  const userId = _id.toString();
  const accessToken = jwtHelpers.createToken(
    { userId, role },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.createToken(
    { userId, role },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string): Promise<IRefreshTokenResponse> => {
  //verify token
  // invalid token - synchronous
  let verifiedToken = null;
  try {
    verifiedToken = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_secret as Secret
    );
  } catch (err) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid Refresh Token');
  }

  const { userId } = verifiedToken;

  // checking deleted user's refresh token

  const isUserExist = await User.findById(userId);
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }
  //generate new token

  const newAccessToken = jwtHelpers.createToken(
    {
      userId: isUserExist._id.toString(),
      role: isUserExist.role,
    },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  return {
    accessToken: newAccessToken,
  };
};

const changePassword = async (
  user: JwtPayload | null,
  payload: IChangePassword
): Promise<void> => {
  const { oldPassword, newPassword } = payload;

  const isUserExist = await User.findById(user?.userId).select('+password');

  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }

  // checking old password
  if (!(await User.isPasswordMatched(oldPassword, isUserExist.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Old Password is incorrect');
  }

  // password is hashed and passwordChangedAt is set in the pre save hook
  isUserExist.password = newPassword;
  await isUserExist.save();
};

const forgotPass = async (payload: { email: string }): Promise<void> => {
  const user = await User.findOne({ email: payload.email });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User does not exist!');
  }

  const passResetToken = jwtHelpers.createResetToken(
    { id: user._id.toString() },
    config.jwt.secret as string,
    '50m'
  );

  const resetLink: string = config.resetlink + `token=${passResetToken}`;

  await sendEmail(
    user.email,
    `
      <div>
        <p>Hi, ${user.name}</p>
        <p>Your password reset link: <a href=${resetLink}>Click Here</a></p>
        <p>Thank you</p>
      </div>
  `
  );
};

const resetPassword = async (
  payload: { newPassword: string },
  token: string
): Promise<void> => {
  let verifiedToken = null;
  try {
    verifiedToken = jwtHelpers.verifyToken(token, config.jwt.secret as string);
  } catch (err) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid Reset Token');
  }

  // the user comes from the verified token, never from the request body
  if (!verifiedToken.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid Reset Token');
  }

  const user = await User.findById(verifiedToken.id);

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found!');
  }

  user.password = payload.newPassword;
  await user.save();
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
  changePassword,
  forgotPass,
  resetPassword,
};
