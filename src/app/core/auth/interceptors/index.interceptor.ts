import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../session/index.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const router = inject(Router);

  const token = session.token;
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      // Só o 401 é sessão inválida (token ausente ou expirado). O 403 é falta de permissão para aquela chamada:
      // a sessão segue válida, e quem chamou mostra o erro.
      if (error instanceof HttpErrorResponse && error.status === 401) {
        session.clearSession();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
