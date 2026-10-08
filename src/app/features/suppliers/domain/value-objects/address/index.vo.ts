import type { ViaCepResponseDTO } from '../../../../../core/integrations/via-cep/index.dto';
import { Address } from '../../index.model';

export type ZipCodeLookup =
  | { found: true; address: Pick<Address, 'street' | 'neighborhood' | 'city' | 'state'> }
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
