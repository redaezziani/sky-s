import { env } from "process";

interface Secrets {
  Port: number | string;
  JwtSecret: string;
  JwtExpiresIn: string;
  JwtRefreshSecret: string;
  JwtRefreshExpiresIn: string;
  DatabaseUrl: string;
  BcryptSaltRounds: number;
  ImageKitPublicKey: string;
  ImageKitPrivateKey: string;
  ImageKitUrlEndpoint: string;
}

export const secrets: Secrets = {
  Port: env.MAIN_APP_PORT || 3000,
  JwtSecret: env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JwtExpiresIn: env.JWT_EXPIRES_IN || '15m',
  JwtRefreshSecret: env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
  JwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN || '7d',
  DatabaseUrl: env.DATABASE_URL!,
  BcryptSaltRounds: parseInt(env.BCRYPT_SALT_ROUNDS || '12'),
  ImageKitPublicKey: env.IMAGEKIT_PUBLIC_KEY || '',
  ImageKitPrivateKey: env.IMAGEKIT_PRIVATE_KEY || '',
  ImageKitUrlEndpoint: env.IMAGEKIT_URL_ENDPOINT || '',
}