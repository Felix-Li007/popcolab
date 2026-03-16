export type Provider = {
  id?: number;
  providerType: string;
  providerLabel: string;
  providerNotes?: string | null;
  pricingNotes?: string | null;
  experienceCount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ProviderFormState = {
  errors: {
    providerType?: string;
    providerLabel?: string;
    providerNotes?: string;
    pricingNotes?: string;
    _form?: string;
  };
  success?: boolean;
};
