export { routes } from './index.routes';
export { SuppliersRepository } from './infrastructure/index.repository';
export { CreateSupplierUseCase } from './application/use-cases/create-supplier/index.use-case';
export { addressFromViaCep } from './domain/value-objects/address/index.vo';
export type { Address, NewSupplier, Supplier, SupplierRanking } from './domain/index.model';
