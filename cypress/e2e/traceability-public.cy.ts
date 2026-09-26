const stage = {
  chainId: 501,
  batchId: 42,
  originAddress: {
    addressId: 1,
    street: 'Rua das Flores',
    number: '10',
    neighborhood: 'Centro',
    complement: '',
    zipCode: '01000-000',
    city: 'São Paulo',
    state: 'SP',
  },
  destinationAddress: null,
  responsibleUserId: 8,
  responsibleUserName: 'Equipe de produção',
  stageType: 'PRODUCTION',
  startedAt: '2025-04-10T09:00:00Z',
  endedAt: '2025-04-10T12:00:00Z',
  transport: null,
  emission: {
    emissionId: 900,
    chainId: 501,
    emissionFactor: 0.4,
    co2Kg: 12.5,
    calculationMethod: 'DEFRA',
    calculatedAt: '2025-04-10T12:05:00Z',
  },
};

describe('Public batch traceability', () => {
  it('shows the batch journey and carbon footprint without a session', () => {
    cy.intercept('GET', '**/api/v1/batches/42/traceability', {
      statusCode: 200,
      body: {
        batchId: 42,
        productName: 'Café orgânico',
        supplierName: 'Fazenda Verde',
        quantity: 100,
        producedAt: '2025-04-10',
        stages: [stage],
        totalCo2Kg: 12.5,
      },
    }).as('traceability');
    cy.intercept('GET', '**/api/v1/batches/42/carbon-footprint', {
      statusCode: 200,
      body: { batchId: 42, totalCo2Kg: 12.5, emissionsByStage: [stage.emission] },
    }).as('carbonFootprint');

    cy.visit('/rastreio/42');
    cy.wait(['@traceability', '@carbonFootprint']);

    cy.contains('h1', 'Café orgânico').should('be.visible');
    cy.contains('Fazenda Verde').should('be.visible');
    cy.contains('Jornada do Lote').should('be.visible');
    cy.contains('Produção').should('be.visible');
    cy.contains('12.5 kg CO₂e').should('be.visible');
  });

  it('shows a friendly message when the batch does not exist', () => {
    cy.intercept('GET', '**/api/v1/batches/999/traceability', { statusCode: 404, body: {} });
    cy.intercept('GET', '**/api/v1/batches/999/carbon-footprint', { statusCode: 404, body: {} });

    cy.visit('/rastreio/999');

    cy.get('[role="alert"]')
      .should('be.visible')
      .and('contain.text', 'Lote não encontrado')
      .and('not.contain.text', '404');
  });
});
