import { UserRole } from '../../../core/auth/session/index.model';

export interface InviteDetails {
  email: string;
  role: UserRole;
  companyName: string;
  expiresAt: string;
}

export interface InviteAcceptance {
  token: string;
  name: string;
  password: string;
}
