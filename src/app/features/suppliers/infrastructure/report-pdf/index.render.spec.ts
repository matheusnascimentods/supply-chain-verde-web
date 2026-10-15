import { marked } from 'marked';
import { escapeMarkdown, placeholdersOf, render } from './index.render';

describe('report pdf render', () => {
  it('replaces the placeholders and keeps the text around them', () => {
    expect(render('Olá, {{name}}! Nº {{id}}.', { name: 'Ana', id: '7' })).toBe('Olá, Ana! Nº 7.');
  });

  it('uses a dash for missing or empty values', () => {
    expect(render('{{a}} e {{b}}', { b: '' })).toBe('— e —');
  });

  it('lists the placeholders of a template', () => {
    expect(placeholdersOf('{{a}} x {{b}}')).toEqual(['a', 'b']);
  });

  it('escapes values so they do not break a table nor become HTML', () => {
    const cell = escapeMarkdown('Fazenda | *Verde*_\n<img src=x onerror=alert(1)>');
    const html = marked.parse(`| a |\n|---|\n| ${cell} |`, { async: false });
    expect(html.match(/<td>/g)).toHaveLength(1);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<em>');
    expect(html).toContain('Fazenda | *Verde*_ &lt;img');
  });
});
