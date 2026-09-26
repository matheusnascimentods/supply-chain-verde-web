const createdBatch = {
  batchId: 77,
  productId: 3,
  quantity: 250,
  producedAt: '2025-05-20',
  supplierId: 9,
  status: 'CREATED',
};
const createdStage = {
  chainId: 180,
  batchId: 77,
  originAddress: null,
  destinationAddress: null,
  responsibleUserId: 15,
  responsibleUserName: 'Fornecedor E2E',
  stageType: 'TRANSPORT',
  startedAt: '2025-05-21T08:00:00Z',
  endedAt: null,
  transport: null,
  emission: null,
};

describe('Supplier batch registration flow', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 200,
      body: { token: 'e2e-supplier-token', expiresAt: '2099-12-31T23:59:59Z', role: 'supplier' },
    }).as('login');
    cy.intercept('GET', '**/api/v1/suppliers/9/batches', { statusCode: 200, body: [createdBatch] }).as('loadBatches');
  });

  it('creates a batch, adds transport to a stage, and calculates its emission', () => {
    cy.intercept('POST', '**/api/v1/batches', { statusCode: 201, body: createdBatch }).as('createBatch');
    cy.intercept('POST', '**/api/v1/batches/77/stages', { statusCode: 201, body: createdStage }).as('createStage');
    cy.intercept('POST', '**/api/v1/stages/180/transport', {
      statusCode: 201,
      body: { transportId: 55, chainId: 180, transportMode: 'ROAD', distance: 120, fuelType: 'DIESEL', capacity: 500 },
    }).as('createTransport');
    cy.intercept('POST', '**/api/v1/stages/180/emission', {
      statusCode: 201,
      body: {
        emissionId: 901,
        chainId: 180,
        emissionFactor: 0.8,
        co2Kg: 96,
        calculationMethod: 'DEFRA',
        calculatedAt: '2025-05-21T09:00:00Z',
      },
    }).as('calculateEmission');
    cy.intercept('GET', '**/api/v1/batches/77/stages', {
      statusCode: 200,
      body: [{ ...createdStage, transport: { transportId: 55, chainId: 180, transportMode: 'ROAD', distance: 120, fuelType: 'DIESEL', capacity: 500 }, emission: { emissionId: 901, chainId: 180, emissionFactor: 0.8, co2Kg: 96, calculationMethod: 'DEFRA', calculatedAt: '2025-05-21T09:00:00Z' } }],
    }).as('loadStages');

    cy.visit('/login', {
      onBeforeLoad(window) {
        window.sessionStorage.setItem('supplierId', '9');
      },
    });
    cy.get('[data-testid="email-input"]').type('supplier@example.com');
    cy.get('[data-testid="password-input"]').type('valid-password');
    cy.get('[data-testid="submit-button"]').click();
    cy.wait('@login');
    cy.visit('/batches');
    cy.wait('@loadBatches');

    cy.contains('a', 'Novo').click();
    cy.get('input[formcontrolname="productId"]').type('3');
    cy.get('input[formcontrolname="quantity"]').type('250');
    cy.get('input[formcontrolname="producedAt"]').type('2025-05-20');
    cy.contains('form button', 'Salvar').click();
    cy.wait('@createBatch').its('request.body').should('include', { productId: 3, quantity: 250 });
    cy.location('pathname').should('eq', '/batches');
    cy.wait('@loadBatches');

    cy.contains('tr', '77').contains('a', 'Etapas').click();
    cy.location('pathname').should('eq', '/batches/77/stages');
    cy.wait('@loadStages');
    cy.contains('a', 'Nova etapa').click();

    cy.get('app-enum-select select').eq(0).select('TRANSPORT');
    cy.get('input[formcontrolname="startedAt"]').type('2025-05-21T08:00');
    cy.get('app-enum-select select').eq(1).select('ROAD');
    cy.get('input[formcontrolname="distance"]').clear().type('120');
    cy.get('app-enum-select select').eq(2).select('DIESEL');
    cy.get('input[formcontrolname="capacity"]').clear().type('500');
    cy.contains('button', 'Registrar etapa e calcular emissão').click();

    cy.wait('@createStage');
    cy.wait('@createTransport');
    cy.wait('@calculateEmission');
    cy.location('pathname').should('eq', '/batches/77/stages');
    cy.wait('@loadStages');
    cy.contains('TRANSPORT').should('be.visible');
    cy.contains('96 kg CO₂').should('be.visible');
  });
});
