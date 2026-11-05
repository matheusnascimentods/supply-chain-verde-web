import { addressFromViaCep } from './index.vo';

describe('addressFromViaCep', () => {
  it('maps the ViaCEP fields to the supplier address', () => {
    expect(addressFromViaCep({ logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' })).toEqual({
      found: true,
      address: { street: 'Praça da Sé', neighborhood: 'Sé', city: 'São Paulo', state: 'SP' },
    });
  });

  it('fills missing fields with empty strings', () => {
    expect(addressFromViaCep({ uf: 'SP' })).toEqual({ found: true, address: { street: '', neighborhood: '', city: '', state: 'SP' } });
  });

  it('reports a zip code that ViaCEP did not find', () => {
    expect(addressFromViaCep({ erro: true })).toEqual({ found: false });
    expect(addressFromViaCep({ erro: 'true' })).toEqual({ found: false });
  });
});
