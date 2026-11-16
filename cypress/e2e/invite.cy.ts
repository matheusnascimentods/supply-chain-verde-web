// O menu e os perfis do convite dependem da claim `companyType` do token.
const token = ['e30', btoa(JSON.stringify({ companyId: 3, companyType: 'MARKET' })), 'e2e'].join('.');
const invite = { email: 'bia@bompreco.com', role: 'MANAGER', companyName: 'Mercado Bom Preço', expiresAt: '2099-12-31T23:59:59Z' };

describe('User invite', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/users/me', {
      statusCode: 200,
      body: { userId: 1, name: 'Ana', email: 'ana@bompreco.com', role: 'ADMIN', companyId: 3, companyType: 'MARKET', companyName: 'Mercado Bom Preço' },
    });
    // O dashboard chama a API; sem stub, o 401 da API real (token falso) derruba a sessão no meio do teste.
    cy.intercept('GET', '**/api/v1/dashboard/summary*', {
      statusCode: 200,
      body: { activeBatches: 0, expiringCertifications: 0, suppliers: 0, pendingBatches: null, monthlyEmissionKgCo2e: 0, recentBatches: [] },
    });
    cy.intercept('GET', '**/api/v1/dashboard/emissions*', { statusCode: 200, body: [] });
  });

  it('lets the admin invite a user and shows the success toast', () => {
    cy.intercept({ method: 'GET', pathname: '/api/v1/users' }, {
      statusCode: 200,
      body: { items: [{ userId: 1, name: 'Ana', email: 'ana@bompreco.com', role: 'ADMIN' }], limit: 20, offset: 0, hasNext: false, totalPages: 1 },
    }).as('users');
    cy.intercept('POST', '**/api/v1/invites', { statusCode: 201 }).as('invite');

    cy.visit('/users', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('token', token);
        win.sessionStorage.setItem('role', 'admin');
        win.sessionStorage.setItem('email', 'ana@bompreco.com');
      },
    });
    cy.wait('@users');
    cy.contains('button', 'Adicionar usuário').should('not.exist');
    cy.contains('button', 'Convidar usuário').click();

    cy.get('#invite-email').type(invite.email);
    cy.get('select#invite-role').select('Gestor');
    cy.contains('button', 'Enviar convite').click();

    cy.wait('@invite').its('request.body').should('deep.equal', { email: invite.email, role: 'MANAGER' });
    cy.contains('h2', 'Convidar usuário').should('not.exist');
    cy.get('[data-testid="toast-item"]').should('contain.text', `Convite enviado para ${invite.email}.`);
  });

  it('accepts a valid invite and lands on the dashboard logged in', () => {
    cy.intercept('GET', '**/api/v1/invites/abc123', { statusCode: 200, body: invite }).as('find');
    cy.intercept('POST', '**/api/v1/invites/accept', {
      statusCode: 200,
      body: { token, expiresAt: '2099-12-31T23:59:59Z', role: 'MANAGER' },
    }).as('accept');

    cy.visit('/convites/abc123');
    cy.wait('@find');
    cy.get('dl').should('contain.text', invite.email).and('contain.text', 'Mercado Bom Preço').and('contain.text', 'Gestor');
    cy.get('#invite-name').type('Bia Lima');
    cy.get('#invite-password').type('segredo123');
    cy.get('#invite-confirm-password').type('segredo123');
    cy.get('[data-testid="invite-submit"]').click();

    cy.wait('@accept').its('request.body').should('deep.equal', { token: 'abc123', name: 'Bia Lima', password: 'segredo123' });
    cy.location('pathname').should('eq', '/dashboard');
    cy.window().its('sessionStorage').invoke('getItem', 'role').should('eq', 'manager');
  });

  it('shows the invalid notice, without the form, for an expired or used link', () => {
    cy.intercept('GET', '**/api/v1/invites/used', {
      statusCode: 404,
      body: { error: 'Not Found', message: 'Convite inválido ou expirado.', status: 404 },
    });

    cy.visit('/convites/used');
    cy.get('[data-testid="invite-invalid"]')
      .should('contain.text', 'Peça um novo convite ao administrador da sua empresa.')
      .contains('a', 'Entrar')
      .should('have.attr', 'href', '/login');
    cy.get('form').should('not.exist');
  });
});
