const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');

test('search uses visible card content, Lithuanian normalization and category filters', () => {
    // Only the DOM surface used by app.js is needed; no browser dependency.
    function element(textContent = '') {
        const children = new Map();
        return {
            textContent, dataset: {}, value: '', hidden: false, events: {},
            classList: { add() {}, toggle() {} },
            setAttribute() {},
            addEventListener(type, callback) { this.events[type] = callback; },
            querySelector(selector) {
                if (!children.has(selector)) children.set(selector, element());
                return children.get(selector);
            }
        };
    }

    const fixtures = [
        ['plan', 'discover', 'Plan', 'Kryptis', 'Suskaidyk darbą', 'Tikrink rizikas'],
        ['build', 'create', 'Build', 'Kūrimas', 'Kurk mažais pakeitimais', 'Peržiūrėk diff']
    ];
    const cards = fixtures.map(([stage, category, title, label, description, tips]) => {
        const card = element();
        card.dataset = { stage, category };
        Object.entries({
            h3: title,
            '.category-tag': label,
            '.stage-description': description,
            '.stage-tips': tips,
            '.detail-text': 'Planas paslėptas: detaluspaaiskinimas',
            '.detail-example': 'Plan example: slaptaspavyzdys'
        }).forEach(([selector, text]) => { card.querySelector(selector).textContent = text; });
        return card;
    });
    const filters = ['all', 'discover', 'create'].map(filter => {
        const button = element();
        button.dataset.filter = filter;
        return button;
    });
    const document = element();
    document.documentElement = element();
    document.querySelectorAll = selector => selector === '.stage-card' ? cards : filters;
    const script = readFileSync(resolve(__dirname, '../../main/resources/static/js/app.js'), 'utf8');
    runInNewContext(script, {
        document,
        localStorage: { getItem: () => null },
        window: { addEventListener() {} }
    });

    function search(query, category = 'all') {
        const input = document.querySelector('#stage-search');
        input.value = query;
        input.events.input();
        filters.find(button => button.dataset.filter === category).events.click();
        return cards.filter(card => !card.hidden).map(card => card.dataset.stage);
    }

    assert.deepEqual(search(''), ['plan', 'build']);
    assert.deepEqual(search('  PLAN  '), ['plan']);
    assert.deepEqual(search('detaluspaaiskinimas'), []);
    assert.deepEqual(search('slaptaspavyzdys'), []);
    assert.deepEqual(search('KŪRIMAS'), ['build']);
    assert.deepEqual(search('kurimas'), ['build']);
    assert.deepEqual(search('MAŽAIS'), ['build']);
    assert.deepEqual(search('perziurek diff'), ['build']);
    assert.deepEqual(search('kurimas diff', 'create'), ['build']);
    assert.deepEqual(search('plan', 'create'), []);
    assert.equal(document.querySelector('#empty-state').hidden, false);
    assert.deepEqual(search('plan', 'discover'), ['plan']);
    assert.equal(document.querySelector('#empty-state').hidden, true);
    assert.deepEqual(search('', 'create'), ['build']);
    assert.deepEqual(search('   '), ['plan', 'build']);
});
