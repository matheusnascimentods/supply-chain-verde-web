describe('Login', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 200,
      body: { token: 'e2e-manager-token', expiresAt: '2099-12-31T23:59:59Z', role: 'manager' },
    }).as('login');
  });

  it('opens the login from the default URL and redirects a valid user to their dashboard', () => {
    cy.visit('/');
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
    cy.contains('Gestor').should('be.visible');
    cy.contains('a', 'Produtos').should('be.visible');
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
