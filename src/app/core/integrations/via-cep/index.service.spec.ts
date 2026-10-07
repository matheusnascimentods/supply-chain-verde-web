import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ViaCepService } from './index.service';

describe('ViaCepService', () => {
  let service: ViaCepService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ViaCepService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('looks up the address for a zip code', () => {
    service.lookup('01000000').subscribe((address) => {
      expect(address).toMatchObject({ logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' });
    });
    const request = http.expectOne('https://viacep.com.br/ws/01000000/json/');
    expect(request.request.method).toBe('GET');
    request.flush({ logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' });
  });

  it('accepts the not-found payload returned by ViaCEP', () => {
    service.lookup('99999999').subscribe((address) => expect(address.erro).toBe('true'));
    http.expectOne('https://viacep.com.br/ws/99999999/json/').flush({ erro: 'true' });
  });
});
