export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }

  static badRequest(message: string) {
    return new ApiError(400, message);
  }

  static unauthorized(message: string) {
    return new ApiError(401, message);
  }

  static forbidden(message: string) {
    return new ApiError(403, message);
  }

  static notFound(message: string) {
    return new ApiError(404, message);
  }

  static internal(message: string) {
    return new ApiError(500, message);
  }
}
