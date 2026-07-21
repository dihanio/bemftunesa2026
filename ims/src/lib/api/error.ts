export class ApiError extends Error {
  public readonly status: number;
  public readonly responseData?: unknown;

  constructor(status: number, message: string, responseData?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.responseData = responseData;
    
    // Set prototype explicitly to fix instanceof checking in older environments
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
