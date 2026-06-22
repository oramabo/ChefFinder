export interface TurnstilePort {
  // Returns true when the token is valid (or when running in mock/bypass mode).
  verify(token: string, remoteIp?: string): Promise<boolean>;
}
