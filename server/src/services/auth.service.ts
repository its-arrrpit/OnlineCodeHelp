// ===================================================================
// Auth Service — Business Logic for Authentication
// ===================================================================
// This file contains the core auth logic: register and login.
//
// WHY A SEPARATE SERVICE?
//   The controller handles HTTP (parse request, send response).
//   The service handles business logic (hash password, verify, sign JWT).
//   This separation means:
//   1. Services are testable without HTTP (no req/res needed)
//   2. Services can be reused (e.g., worker might need to verify a user)
//   3. Controllers stay thin and focused
//
// SECURITY CONCEPTS:
//
// bcrypt:
//   We NEVER store plain-text passwords. bcrypt hashes the password
//   with a random salt. Even if the database is breached, attackers
//   can't reverse the hash to get the original password.
//   bcrypt is intentionally slow (configurable "rounds") to resist
//   brute-force attacks.
//
// JWT (JSON Web Token):
//   After login, we give the user a signed token containing their
//   userId and role. On subsequent requests, the client sends this
//   token in the Authorization header. The server verifies the
//   signature — if it's valid, the user is authenticated.
//   The server does NOT store sessions — the token IS the session.
//
// TYPESCRIPT CONCEPT — Promise<T>:
//   `async function register(...): Promise<{ user, token }>` means:
//   This function returns a Promise that, when resolved, gives you
//   an object with `user` and `token` properties.
//   The `await` keyword pauses execution until the Promise resolves.
// ===================================================================

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { JwtPayload } from '../types';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

// ─── Constants ──────────────────────────────────────────────────────

// bcrypt salt rounds: higher = more secure but slower.
// 10 rounds ≈ 10 hashes/second on modern hardware. Good balance.
const SALT_ROUNDS = 10;

// ─── Register ───────────────────────────────────────────────────────

/**
 * Registers a new user.
 *
 * Flow:
 * 1. Check if username or email already exists
 * 2. Hash the password with bcrypt
 * 3. Create the user in PostgreSQL
 * 4. Sign a JWT token
 * 5. Return the user (without passwordHash) and the token
 */
export async function register(input: RegisterInput) {
  const { username, email, password } = input;

  // Check for existing user with same email
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });
  if (existingEmail) {
    throw ApiError.conflict('Email is already registered');
  }

  // Check for existing user with same username
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    throw ApiError.conflict('Username is already taken');
  }

  // Hash password with bcrypt
  // bcrypt.hash(password, saltRounds) generates a random salt and
  // hashes the password. The result includes the salt, so we only
  // need to store the hash — not the salt separately.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user in database
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      // role defaults to USER (set in Prisma schema)
    },
    // Select only the fields we want to return.
    // NEVER include passwordHash in API responses.
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // Sign JWT
  const token = signToken({ userId: user.id, role: user.role });

  return { user, token };
}

// ─── Login ──────────────────────────────────────────────────────────

/**
 * Authenticates a user with email and password.
 *
 * Flow:
 * 1. Find user by email
 * 2. Compare password with stored hash using bcrypt
 * 3. Sign a JWT token
 * 4. Return the user (without passwordHash) and the token
 *
 * SECURITY NOTE:
 *   We use the same error message for "user not found" and "wrong password".
 *   This prevents an attacker from learning whether an email is registered.
 *   If we said "user not found" vs "wrong password", the attacker could
 *   enumerate valid emails.
 */
export async function login(input: LoginInput) {
  const { email, password } = input;

  // Find user by email (include passwordHash for comparison)
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Same error message as wrong password — prevents email enumeration
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Compare the provided password with the stored hash.
  // bcrypt.compare() hashes the input with the same salt from the
  // stored hash and checks if they match.
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Sign JWT
  const token = signToken({ userId: user.id, role: user.role });

  // Return user without passwordHash
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  };
}

// ─── Get Current User ───────────────────────────────────────────────

/**
 * Fetches the current user's profile by ID.
 * Called from the /api/auth/me endpoint.
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
}

// ─── Helper: Sign JWT ───────────────────────────────────────────────

/**
 * Creates a signed JWT token.
 *
 * The token contains:
 *   { userId: "abc-123", role: "USER" }
 *
 * It's signed with JWT_SECRET so the server can verify it later.
 * It expires after JWT_EXPIRES_IN (default: 7 days).
 *
 * TYPESCRIPT CONCEPT — Type Assertion:
 *   jwt.sign() accepts `string | Buffer | object` for the payload.
 *   We pass our JwtPayload object, which satisfies `object`.
 */
function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}
