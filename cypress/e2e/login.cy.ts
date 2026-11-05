// O menu depende da claim `companyType` do token.
const managerToken = ['e30', btoa(JSON.stringify({ companyId: 3, companyType: 'MARKET' })), 'e2e'].join('.');

describe('Login', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 200,
      body: { token: managerToken, expiresAt: '2099-12-31T23:59:59Z', role: 'manager' },
    }).as('login');
    cy.intercept('GET', '**/api/v1/users/me', {
      statusCode: 200,
      body: { userId: 2, name: 'Gestor', email: 'manager@example.com', role: 'MANAGER', companyId: 3, companyType: 'MARKET', companyName: 'Mercado Bom Preço' },
    });
    // O dashboard chama a API; sem stub, o 401 da API real (token falso) derruba a sessão no meio do teste.
    cy.intercept('GET', '**/api/v1/dashboard/summary*', {
      statusCode: 200,
      body: { activeBatches: 0, expiringCertifications: 0, suppliers: 0, pendingBatches: null, monthlyEmissionKgCo2e: 0, recentBatches: [] },
    });
    cy.intercept('GET', '**/api/v1/dashboard/emissions*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/v1/plans', {
      statusCode: 200,
      body: [{ code: 'BASIC', name: 'Basic', maxUsers: 3 }],
    });
  });

  it('opens the login from the plans page and redirects a valid user to their dashboard', () => {
    cy.visit('/');
    cy.get('[data-testid="landing-cta"]').click();
    cy.location('pathname').should('eq', '/planos');
    cy.get('[data-testid="public-header-login"]').click();
    cy.location('pathname').should('eq', '/login');
    cy.get('[data-testid="email-input"]').type('manager@example.com');
    cy.get('[data-testid="password-input"]').type('valid-password');
    cy.get('[data-testid="submit-button"]').click();

    cy.wait('@login').its('request.body').should('deep.equal', {
      email: 'manager@example.com',
      password: 'valid-password',
    });
    cy.location('pathname').should('eq', '/dashboard');
    cy.contains('h1', 'Bem-vindo(a)').should('be.visible');
    cy.contains('Gestor · Mercado Bom Preço').should('be.visible');
    cy.contains('a', 'Produtos').should('not.exist');
    cy.contains('a', 'Lotes').should('be.visible');
  });

  it('shows a generic message when credentials are rejected', () => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' },
    }).as('rejectedLogin');

    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('unknown@example.com');
    cy.get('[data-testid="password-input"]').type('wrong-password');
    cy.get('[data-testid="submit-button"]').click();

    cy.wait('@rejectedLogin');
    cy.get('[data-testid="error-alert"]')
      .should('be.visible')
      .and('contain.text', 'Email ou senha incorretos');
    cy.location('pathname').should('eq', '/login');
  });
});
