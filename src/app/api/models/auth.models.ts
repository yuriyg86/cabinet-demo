export interface LogonRequest {
  login: string;
  password: string;
}

export interface LogonResponse {
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokensResponse {
  token: string;
  refreshToken: string;
}
