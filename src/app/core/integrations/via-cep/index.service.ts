import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ViaCepResponseDTO, viaCepResponseSchema } from './index.dto';

@Injectable({ providedIn: 'root' })
export class ViaCepService {
  private readonly http = inject(HttpClient);

  lookup(zipCode: string): Observable<ViaCepResponseDTO> {
    return this.http
      .get<unknown>(`https://viacep.com.br/ws/${zipCode}/json/`)
      .pipe(map((raw) => viaCepResponseSchema.parse(raw)));
  }
}
