import type { ViaCepResponseDTO } from '../../../../core/integrations/via-cep/index.dto';

export type ZipCodeLookup =
  | { found: true; address: { street: string; neighborhood: string; city: string; state: string } }
  | { found: false };

export function addressFromViaCep(response: ViaCepResponseDTO): ZipCodeLookup {
  if (response.erro === true || response.erro === 'true') return { found: false };
  return {
    found: true,
    address: {
      street: response.logradouro ?? '',
      neighborhood: response.bairro ?? '',
      city: response.localidade ?? '',
      state: response.uf ?? '',
    },
  };
}
