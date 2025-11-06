export class YouTubeApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: string,
  ) {
    super(message);
    this.name = "YouTubeApiError";
  }
}
