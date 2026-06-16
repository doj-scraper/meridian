/**
 * Centralized API Error Handling
 * 
 * Standardized error responses, error codes, and helper functions
 * for consistent API error handling across all endpoints.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

// ── Error Codes ──

export enum ApiErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  
  // Server Errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
}

// ── Error Response Structure ──

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
    timestamp: string;
    path?: string;
  };
}

// ── Error Classes ──

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(ApiErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(ApiErrorCode.NOT_FOUND, message, 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super(ApiErrorCode.UNAUTHORIZED, message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Access denied") {
    super(ApiErrorCode.FORBIDDEN, message, 403);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(ApiErrorCode.CONFLICT, message, 409);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends ApiError {
  constructor(message = "Rate limit exceeded") {
    super(ApiErrorCode.RATE_LIMIT_EXCEEDED, message, 429);
    this.name = "RateLimitError";
  }
}

export class DatabaseError extends ApiError {
  constructor(message = "Database operation failed", details?: unknown) {
    super(ApiErrorCode.DATABASE_ERROR, message, 500, details);
    this.name = "DatabaseError";
  }
}

export class ExternalServiceError extends ApiError {
  constructor(service: string, message?: string) {
    const errorMessage = message || `External service '${service}' failed`;
    super(ApiErrorCode.EXTERNAL_SERVICE_ERROR, errorMessage, 503);
    this.name = "ExternalServiceError";
  }
}

// ── Error Response Builders ──

/**
 * Create a standardized error response from an ApiError.
 */
export function createErrorResponse(error: ApiError, path?: string): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
      path,
    },
  };

  return NextResponse.json(response, { status: error.statusCode });
}

/**
 * Create a validation error response from Zod validation error.
 */
export function createValidationErrorResponse(zodError: ZodError, path?: string): NextResponse<ApiErrorResponse> {
  const formattedErrors = zodError.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  const response: ApiErrorResponse = {
    error: {
      code: ApiErrorCode.VALIDATION_ERROR,
      message: "Validation failed",
      details: formattedErrors,
      timestamp: new Date().toISOString(),
      path,
    },
  };

  return NextResponse.json(response, { status: 400 });
}

/**
 * Create a generic error response from unknown error.
 */
export function createGenericErrorResponse(
  error: unknown,
  path?: string
): NextResponse<ApiErrorResponse> {
  console.error("Unhandled error:", error);

  // If it's already an ApiError, use it
  if (error instanceof ApiError) {
    return createErrorResponse(error, path);
  }

  // If it's a Zod error, format it
  if (error instanceof ZodError) {
    return createValidationErrorResponse(error, path);
  }

  // If it's a generic Error, extract message
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  const response: ApiErrorResponse = {
    error: {
      code: ApiErrorCode.INTERNAL_ERROR,
      message,
      timestamp: new Date().toISOString(),
      path,
    },
  };

  return NextResponse.json(response, { status: 500 });
}

// ── Error Handler Middleware ──

/**
 * Wrap an API route handler with error handling.
 * 
 * @example
 * ```ts
 * export const POST = withErrorHandler(async (req) => {
 *   // Your route logic
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withErrorHandler<T = unknown>(
  handler: (req: Request) => Promise<NextResponse<T>>
) {
  return async (req: Request): Promise<NextResponse<T | ApiErrorResponse>> => {
    try {
      return await handler(req);
    } catch (error) {
      const url = new URL(req.url);
      return createGenericErrorResponse(error, url.pathname);
    }
  };
}

// ── Validation Helper ──

/**
 * Validate request body and throw ValidationError if invalid.
 */
export async function validateRequestBody<T>(
  req: Request,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError("Request validation failed", error.errors);
    }
    throw error;
  }
}

// ── Success Response Builders ──

/**
 * Create a standardized success response.
 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Create a paginated success response.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<PaginatedResponse<T>> {
  const response: PaginatedResponse<T> = {
    data,
    pagination: {
      page,
      limit,
      total,
      hasMore: page * limit < total,
    },
  };

  return NextResponse.json(response);
}

// ── HTTP Status Helpers ──

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ── Query Parameter Helpers ──

/**
 * Parse and validate query parameters.
 */
export function getQueryParam(req: Request, key: string, required = false): string | null {
  const url = new URL(req.url);
  const value = url.searchParams.get(key);

  if (required && !value) {
    throw new ValidationError(`Missing required query parameter: ${key}`);
  }

  return value;
}

/**
 * Parse query parameter as integer.
 */
export function getIntQueryParam(
  req: Request,
  key: string,
  defaultValue?: number
): number | null {
  const value = getQueryParam(req, key, false);

  if (value === null) {
    return defaultValue ?? null;
  }

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new ValidationError(`Query parameter '${key}' must be a valid integer`);
  }

  return parsed;
}

/**
 * Parse query parameter as boolean.
 */
export function getBooleanQueryParam(
  req: Request,
  key: string,
  defaultValue?: boolean
): boolean | null {
  const value = getQueryParam(req, key, false);

  if (value === null) {
    return defaultValue ?? null;
  }

  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;

  throw new ValidationError(`Query parameter '${key}' must be 'true' or 'false'`);
}
