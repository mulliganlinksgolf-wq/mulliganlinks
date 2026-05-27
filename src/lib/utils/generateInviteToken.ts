import crypto from 'crypto';

export function generateInviteToken(): string {
  return crypto.randomBytes(16).toString('hex');
}
