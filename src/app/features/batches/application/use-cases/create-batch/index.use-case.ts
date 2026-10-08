import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, catchError, concat, defer, map, tap, throwError } from 'rxjs';
import { CreateSupplierUseCase, NewSupplier, Supplier } from '../../../../suppliers';
import { Batch } from '../../../domain/index.model';
import { NewProduct, Product } from '../../../domain/product/index.model';
import { ProductsRepository } from '../../../infrastructure/product/index.repository';
import { BatchesRepository } from '../../../infrastructure/index.repository';

export interface BatchDraft {
  product: { productId: number } | NewProduct;
  supplier: { supplierId: number } | NewSupplier;
  quantity: number;
  producedAt: string;
}

export type CreateBatchProgress =
  | { step: 'product'; product: Product }
  | { step: 'supplier'; supplier: Supplier }
  | { step: 'batch'; batch: Batch };

export type CreateBatchStep = CreateBatchProgress['step'];

export class CreateBatchError extends Error {
  constructor(readonly step: CreateBatchStep) {
    super(`Falha ao criar ${step}`);
  }
}

const failAt = <T>(step: CreateBatchStep) =>
  catchError<T, Observable<never>>(() => throwError(() => new CreateBatchError(step)));

/**
 * Cadastra, nesta ordem, o produto novo, o fornecedor novo e o lote.
 * Cada cadastro concluído é emitido como progresso: quem chama guarda o registro criado
 * e, numa nova tentativa, envia o id dele no rascunho para não duplicar o cadastro.
 */
@Injectable({ providedIn: 'root' })
export class CreateBatchUseCase {
  private readonly products = inject(ProductsRepository);
  private readonly createSupplier = inject(CreateSupplierUseCase);
  private readonly batches = inject(BatchesRepository);

  execute(draft: BatchDraft): Observable<CreateBatchProgress> {
    let productId = 'productId' in draft.product ? draft.product.productId : null;
    let supplierId = 'supplierId' in draft.supplier ? draft.supplier.supplierId : null;

    const product$ = defer(() =>
      productId !== null
        ? EMPTY
        : this.products.create(draft.product as NewProduct).pipe(
            tap((product) => (productId = product.productId)),
            map((product): CreateBatchProgress => ({ step: 'product', product })),
            failAt('product'),
          ),
    );
    const supplier$ = defer(() =>
      supplierId !== null
        ? EMPTY
        : this.createSupplier.execute(draft.supplier as NewSupplier).pipe(
            tap((supplier) => (supplierId = supplier.supplierId)),
            map((supplier): CreateBatchProgress => ({ step: 'supplier', supplier })),
            failAt('supplier'),
          ),
    );
    const batch$ = defer(() =>
      this.batches
        .create({ productId: productId!, supplierId: supplierId!, quantity: draft.quantity, producedAt: draft.producedAt })
        .pipe(
          map((batch): CreateBatchProgress => ({ step: 'batch', batch })),
          failAt('batch'),
        ),
    );
    return concat(product$, supplier$, batch$);
  }
}
