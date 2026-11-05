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
  marketId: 2,
  marketName: 'Mercado Bom Preço',
  status: 'PENDING',
  rejectionReason: null,
  currentStage: null,
  stages: [],
};
const ranking = {
  ...supplier,
  registeredAt: '2025-01-10',
  sustainabilityScore: 87.5,
  activeCertificationCount: 1,
  totalCo2Kg: 120,
  reportCount: 0,
  certifications: [],
  co2KgPerUnit: 0.42,
  workedWith: true,
};

// Quem pede lote é o gestor ou o admin do varejista (RF-13); o menu vem da claim `companyType`.
const managerToken = ['e30', btoa(JSON.stringify({ companyId: 2, companyType: 'MARKET' })), 'e2e'].join('.');

describe('Batch registration wizard', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 200,
      body: { token: managerToken, expiresAt: '2099-12-31T23:59:59Z', role: 'manager' },
    }).as('login');
    cy.intercept('GET', '**/api/v1/batches?page=0&size=20', {
      statusCode: 200,
      body: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 },
    }).as('loadBatches');
    cy.intercept('GET', '**/api/v1/products*', {
      statusCode: 200,
      body: { items: [product], limit: 20, offset: 0, hasNext: false, totalPages: 1 },
    }).as('loadProducts');
    cy.intercept({ method: 'GET', pathname: '/api/v1/suppliers', query: { ranked: 'true' } }, {
      statusCode: 200,
      body: { items: [ranking], limit: 20, offset: 0, hasNext: false, totalPages: 1 },
    }).as('loadRanking');
    // O top-nav busca o nome da companhia; sem stub, o 401 da API real derruba a sessão.
    cy.intercept('GET', '**/api/v1/users/me', {
      statusCode: 200,
      body: { userId: 4, name: 'Gestor', email: 'manager@example.com', role: 'MANAGER', companyId: 2, companyType: 'MARKET', companyName: 'Mercado Bom Preço' },
    });
  });

  it('lets a retailer manager pick an existing product and a ranked supplier, review, and create the batch', () => {
    cy.intercept('POST', '**/api/v1/batches', { statusCode: 201, body: createdBatch }).as('createBatch');
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('manager@example.com');
    cy.get('[data-testid="password-input"]').type('valid-password');
    cy.get('[data-testid="submit-button"]').click();
    cy.wait('@login');
    cy.visit('/batches');
    cy.wait('@loadBatches');
    cy.wait('@loadProducts');

    cy.contains('button', 'Novo lote').click();
    cy.wait('@loadProducts');
    cy.get('input[type="number"]').type('250');
    cy.get('input[type="date"]').type('2025-05-20');
    cy.contains('button', 'Café orgânico').click();
    cy.contains('button', 'Avançar').click();
    cy.wait('@loadRanking');
    cy.contains('button', 'Fazenda Verde').click();
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
