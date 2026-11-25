const product = {
  productId: 3,
  name: 'Café orgânico',
  description: 'Café de origem sustentável',
  category: 'AGRICULTURE',
  unit: 'KG',
  supplierId: 9,
  supplierName: 'Fazenda Verde',
  co2KgPerUnit: 0.42,
  acceptedBatchesLast30Days: 2,
};
const otherProduct = { ...product, productId: 5, name: 'Arroz', supplierId: 7, supplierName: 'Grãos da Serra', co2KgPerUnit: null, acceptedBatchesLast30Days: 0 };
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
      body: { items: [product, otherProduct], limit: 100, offset: 0, hasNext: false, totalPages: 1 },
    }).as('loadProducts');
    // O modal pagina de 20 em 20; a lista de lotes carrega o catálogo inteiro (limit=100) para mostrar a unidade.
    cy.intercept({ method: 'GET', pathname: '/api/v1/products', query: { limit: '20' } }, {
      statusCode: 200,
      body: { items: [product, otherProduct], limit: 20, offset: 0, hasNext: false, totalPages: 1 },
    }).as('loadCatalog');
    // O top-nav busca o nome da companhia; sem stub, o 401 da API real derruba a sessão.
    cy.intercept('GET', '**/api/v1/users/me', {
      statusCode: 200,
      body: { userId: 4, name: 'Gestor', email: 'manager@example.com', role: 'MANAGER', companyId: 2, companyType: 'MARKET', companyName: 'Mercado Bom Preço' },
    });
  });

  function loginAndOpenBatches(): void {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('manager@example.com');
    cy.get('[data-testid="password-input"]').type('valid-password');
    cy.get('[data-testid="submit-button"]').click();
    cy.wait('@login');
    cy.visit('/batches');
    cy.wait('@loadBatches');
  }

  // A primeira resposta é o lote antes da ação; as seguintes, o lote atualizado que a lista recarrega.
  function stubBatches(before: object, after: object): void {
    let calls = 0;
    cy.intercept('GET', '**/api/v1/batches?page=0&size=20', (req) => {
      const batch = calls++ === 0 ? before : after;
      req.reply({ content: [batch], page: 0, size: 20, totalElements: 1, totalPages: 1 });
    }).as('loadBatches');
  }

  it('lets a retailer manager request a batch: search the catalog, pick a product, then the quantity', () => {
    cy.intercept('POST', '**/api/v1/batches', { statusCode: 201, body: createdBatch }).as('createBatch');
    loginAndOpenBatches();

    cy.contains('button', 'Novo lote').click();
    // O catálogo abre já ordenado, sem exigir categoria nem unidade.
    cy.wait('@loadCatalog').its('request.query').should('not.have.any.keys', 'category', 'unit');
    cy.contains('button', 'Café orgânico').should('contain.text', 'Recomendado').and('contain.text', '2 lotes nos últimos 30 dias');

    cy.get('#batch-product-search').type('fazenda');
    cy.wait('@loadCatalog').its('request.query').should('include', { search: 'fazenda' });
    cy.get('select#batch-category').select('AGRICULTURE');
    cy.wait('@loadCatalog').its('request.query').should('include', { search: 'fazenda', category: 'AGRICULTURE' });

    cy.contains('button', 'Café orgânico').click();
    cy.contains('button', 'Avançar').click();

    cy.contains('h3', 'Revise o pedido').should('be.visible');
    cy.get('.review-list').should('contain.text', 'Fazenda Verde');
    cy.get('input[type="date"]').should('not.exist');
    cy.get('#batch-quantity').type('250');
    cy.get('[data-testid="confirm-batch"]').click();

    cy.wait('@createBatch').its('request.body').should('deep.equal', { productId: 3, supplierId: 9, quantity: 250 });
    cy.location('pathname').should('eq', '/batches');
    cy.contains('Pedir novo lote').should('not.exist');
  });

  it('lets the retailer manager cancel a pending batch after confirming', () => {
    stubBatches(createdBatch, { ...createdBatch, status: 'CANCELED' });
    cy.intercept('PATCH', '**/api/v1/batches/77/cancel', { statusCode: 200, body: { ...createdBatch, status: 'CANCELED' } }).as('cancelBatch');
    loginAndOpenBatches();

    // O fornecedor executa ou recusa; o mercado não vê a etapa de Produção nem o Recusar.
    cy.contains('button', 'Adicionar etapa').should('not.exist');
    cy.contains('button', 'Recusar').should('not.exist');

    cy.get('[data-testid="batch-cancel"]').click();
    cy.contains('Cancelar o pedido do lote #77?').should('be.visible');
    cy.get('[data-testid="confirm-cancel"]').click();

    cy.wait('@cancelBatch').its('request.body').should('deep.equal', {});
    cy.wait('@loadBatches');
    cy.get('app-status-badge').should('have.text', 'Cancelado');
    cy.get('[data-testid="batch-cancel"]').should('not.exist');
  });

  it('lets the retailer manager register the retail stage, which completes the batch', () => {
    const distribution = { ...createdBatch, status: 'ACTIVE', currentStage: 'DISTRIBUTION' };
    const retail = {
      chainId: 6, batchId: 77, originAddress: null, destinationAddress: null, responsibleUserId: 4, responsibleUserName: 'Gestor',
      stageType: 'RETAIL', startedAt: '2026-11-24T10:00:00', endedAt: null, transport: null, emission: null,
    };
    stubBatches(distribution, { ...distribution, status: 'COMPLETED', currentStage: 'RETAIL', stages: [retail] });
    cy.intercept('GET', '**/api/v1/companies/me', {
      statusCode: 200,
      body: {
        companyId: 2, name: 'Mercado Verde', cnpj: '11222333000181', email: null, phone: null, type: 'MARKET',
        address: { street: 'Av. Paulista', number: '1000', neighborhood: 'Bela Vista', complement: null, zipCode: '01310100', city: 'São Paulo', state: 'SP' },
      },
    });
    cy.intercept('POST', '**/api/v1/batches/77/stages', { statusCode: 201, body: retail }).as('createStage');
    loginAndOpenBatches();

    cy.get('[data-testid="batch-cancel"]').should('not.exist');
    cy.contains('button', 'Adicionar etapa').click();
    cy.get('.stage-next').should('have.text', 'Varejo');
    cy.get('input[formControlName="startedAt"]').type('2026-11-24T10:00');
    cy.contains('button', 'Avançar').click();
    cy.contains('.stage-place', 'Destino').should('contain', 'Av. Paulista, 1000 – São Paulo/SP');
    cy.get('fieldset[formGroupName="destination"]').should('not.exist');
    cy.contains('button', 'Avançar').click();
    cy.contains('button', 'Avançar').click();
    cy.contains('h3', 'Revise a etapa').should('be.visible');
    cy.contains('button', 'Confirmar etapa').click();

    cy.wait('@createStage').its('request.body').should('include', { stageType: 'RETAIL', destination: null });
    cy.wait('@loadBatches');
    cy.get('app-status-badge').should('have.text', 'Concluído');
    cy.contains('button', 'Adicionar etapa').should('not.exist');
  });
});
