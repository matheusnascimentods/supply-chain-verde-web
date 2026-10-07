export const CERTIFICATION_STATUSES = ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'UNDER_REVIEW'] as const;

export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];

export const CERTIFICATION_STATUS_LABELS: Record<CertificationStatus, string> = {
  ACTIVE: 'Ativa',
  EXPIRED: 'Expirada',
  SUSPENDED: 'Suspensa',
  UNDER_REVIEW: 'Em análise',
};

export interface Certification {
  certificationId: number;
  supplierId: number;
  certification: string;
  issuingBody: string;
  issuedAt: string;
  expiresAt: string;
  status: CertificationStatus;
}

export interface NewCertification {
  certification: string;
  issuingBody: string;
  issuedAt: string;
  expiresAt: string;
}
