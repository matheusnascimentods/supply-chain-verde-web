describe('Signup', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/plans', {
      statusCode: 200,
      body: [
        { code: 'BASIC', name: 'Basic', maxUsers: 3 },
        { code: 'PRO', name: 'Pro', maxUsers: 10 },
        { code: 'PRO_MAX', name: 'Pro Max', maxUsers: 15 },
      ],
    }).as('plans');
    cy.intercept('GET', 'https://viacep.com.br/ws/01001000/json/', {
      statusCode: 200,
      body: { cep: '01001-000', logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' },
    }).as('viaCep');
    cy.intercept('POST', '**/api/v1/companies', {
      statusCode: 201,
      body: { token: 'e2e-admin-token', expiresAt: '2099-12-31T23:59:59Z', role: 'ADMIN', supplierId: null, companyId: 7, companyType: 'MARKET' },
    }).as('signUp');
  });

  it('signs up a retailer from the landing page and lands on the dashboard logged in', () => {
    cy.visit('/');
    cy.get('[data-testid="landing-cta"]').click();
    cy.wait('@plans');
    cy.contains('[data-testid="plan-card"]', 'Pro Max').should('be.visible');
    cy.get('[data-testid="plan-card"]').eq(1).contains('a', 'Escolher').click();
    cy.location('search').should('eq', '?plano=PRO');

    cy.contains('h2', '1. Empresa').should('be.visible');
    cy.contains('label', 'Varejista').find('input').should('be.checked');
    cy.get('#company-name').type('Mercado Bom Preço LTDA');
    cy.get('#company-cnpj').type('12345678000190').should('have.value', '12.345.678/0001-90');
    cy.get('#company-phone').type('11999990000');
    cy.get('#company-email').type('contato@bompreco.com');
    cy.get('#company-zip-code').type('01001000');
    cy.wait('@viaCep');
    cy.get('#company-street').should('have.value', 'Praça da Sé');
    cy.get('#company-number').type('10');
    cy.get('[data-testid="sign-up-next"]').click();

    cy.contains('h2', '2. Administrador').should('have.focus');
    cy.get('#admin-name').type('Ana Souza');
    cy.get('#admin-email').type('ana@bompreco.com');
    cy.get('#admin-password').type('segredo123');
    cy.get('#admin-confirm-password').type('segredo123');
    cy.get('[data-testid="sign-up-next"]').click();

    cy.contains('h2', '3. Revisão').should('be.visible');
    cy.contains('Mercado Bom Preço LTDA').should('be.visible');
    cy.get('[data-testid="sign-up-submit"]').click();

    cy.wait('@signUp').its('request.body').should('deep.equal', {
      planCode: 'PRO',
      type: 'MARKET',
      company: {
        name: 'Mercado Bom Preço LTDA',
        cnpj: '12345678000190',
        email: 'contato@bompreco.com',
        phone: '11999990000',
        address: { street: 'Praça da Sé', number: '10', neighborhood: 'Sé', complement: null, zipCode: '01001000', city: 'São Paulo', state: 'SP' },
      },
      admin: { name: 'Ana Souza', email: 'ana@bompreco.com', password: 'segredo123' },
    });
    cy.location('pathname').should('eq', '/dashboard');
    cy.contains('h1', 'Bem-vindo(a)').should('be.visible');
  });

  it('sends an unknown plan back to the plans page', () => {
    cy.visit('/cadastro?plano=GOLD');
    cy.location('pathname').should('eq', '/planos');
  });
});
