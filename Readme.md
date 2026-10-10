# API Boilerplate

A starter for REST APIs built with TypeScript, Express.js, Mongoose (MongoDB) and Zod. It ships with JWT authentication and a generic user module; everything else is the reusable architecture.

## Setup

```bash
yarn install
cp .env.example .env   # then fill in the values
yarn start
```

The API is served under `/api/v1`. If `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` are set, a super admin is created on first boot.

## Folder Structure

```
src
├── app.ts                  # express app, middlewares, not found handler
├── server.ts               # database connection and bootstrap
├── config/                 # env variables
├── enums/                  # shared enums (user roles)
├── constants/              # shared constants (pagination fields)
├── errors/                 # ApiError and mongoose / zod error formatters
├── helpers/                # jwtHelpers, paginationHelper
├── interfaces/             # shared types, express Request augmentation
├── shared/                 # catchAsync, sendResponse, pick, logger
└── app
    ├── middlewares/        # auth, validateRequest, globalErrorHandler
    ├── routes/index.ts     # registers every module route
    └── modules
        ├── auth/
        └── user/
```

## Adding a Module

Copy the `user` module pattern into `src/app/modules/<name>/`:

- `<name>.interface.ts` - types
- `<name>.model.ts` - mongoose schema and model
- `<name>.constant.ts` - searchable and filterable fields
- `<name>.validation.ts` - zod schemas, used with `validateRequest`
- `<name>.service.ts` - database logic, throws `ApiError`
- `<name>.controller.ts` - `catchAsync` handlers, replies with `sendResponse`
- `<name>.route.ts` - routes, guarded with `auth(...roles)`

Then register the router in `src/app/routes/index.ts`.

## Roles

`super_admin`, `admin`, `user` (see `src/enums/user.ts`). Protected routes expect the access token in the `Authorization` header.

## API Endpoints

### Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh-token` (reads the `refreshToken` cookie)
- `POST /auth/change-password`
- `POST /auth/forgot-password`
- `POST /auth/reset-password` (reset token in the `Authorization` header)

### User

- `GET /users/me`
- `GET /users` (admin)
- `GET /users?searchTerm=john`
- `GET /users?page=1&limit=10&sortBy=createdAt&sortOrder=asc`
- `GET /users/:id` (admin)
- `PATCH /users/:id` (admin)
- `DELETE /users/:id` (admin)

## Scripts

- `yarn start` - run in watch mode
- `yarn lint:check` / `yarn lint:fix`
- `yarn prettier:check` / `yarn prettier:fix`
