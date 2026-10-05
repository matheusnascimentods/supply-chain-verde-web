const product = {
  productId: 3,
  name: 'Café orgânico',
  description: 'Café de origem sustentável',
  category: 'AGRICULTURE',
  unit: 'KG',
};
const supplier = {
  supplierId: 9,
  name: 'Fazenda Verde',
  cnpj: '12.345.678/0001-90',
  phone: '(11) 3333-2000',
  address: { street: 'Rua A', number: '10', neighborhood: 'Centro', complement: '', zipCode: '01000000', city: 'São Paulo', state: 'SP' },
};
const createdBatch = {
  batchId: 77,
  productId: product.productId,
  productName: product.name,
  quantity: 250,
  producedAt: '2025-05-20',
  supplierId: supplier.supplierId,
  supplierName: supplier.name,
  currentStage: null,
  stages: [],
};

describe('Batch registration wizard', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 200,
      body: { token: 'e2e-supplier-token', expiresAt: '2099-12-31T23:59:59Z', role: 'supplier' },
    }).as('login');
    cy.intercept('GET', '**/api/v1/batches?page=0&size=20', {
      statusCode: 200,
      body: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 },
    }).as('loadBatches');
    cy.intercept('GET', '**/api/v1/products*', {
      statusCode: 200,
      body: { items: [product], limit: 20, offset: 0, hasNext: false, totalPages: 1 },
    }).as('loadProducts');
    cy.intercept('GET', '**/api/v1/users/me', {
      statusCode: 200,
      body: { userId: 9, name: 'Fornecedor E2E', email: 'supplier@example.com', role: 'supplier' },
    }).as('loadCurrentUser');
    cy.intercept('GET', '**/api/v1/suppliers?supplierId=9', {
      statusCode: 200,
      body: supplier,
    }).as('loadSupplier');
  });

  it('selects existing product and own supplier, reviews, and creates the batch', () => {
    cy.intercept('POST', '**/api/v1/batches', { statusCode: 201, body: createdBatch }).as('createBatch');
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('supplier@example.com');
    cy.get('[data-testid="password-input"]').type('valid-password');
    cy.get('[data-testid="submit-button"]').click();
    cy.wait('@login');
    cy.visit('/batches');
    cy.wait('@loadBatches');
    cy.wait('@loadProducts');

    cy.contains('button', 'Novo lote').click();
    cy.wait('@loadProducts');
    cy.wait('@loadCurrentUser');
    cy.wait('@loadSupplier');
    cy.get('input[type="number"]').type('250');
    cy.get('input[type="date"]').type('2025-05-20');
    cy.contains('button', 'Café orgânico').click();
    cy.contains('button', 'Avançar').click();
    cy.contains('Fazenda Verde').should('be.visible');
    cy.contains('button', 'Avançar').click();
    cy.contains('h3', 'Revise os dados do lote').should('be.visible');
    cy.contains('button', 'Confirmar e criar lote').click();

    cy.wait('@createBatch').its('request.body').should('deep.equal', {
      productId: 3,
      supplierId: 9,
      quantity: 250,
      producedAt: '2025-05-20',
    });
    cy.location('pathname').should('eq', '/batches');
    cy.wait('@loadBatches');
    cy.contains('Cadastrar novo lote').should('not.exist');
  });
});
