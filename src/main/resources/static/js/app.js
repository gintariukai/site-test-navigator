(() => {
    'use strict';

    const storageKey = 'vibe-coding-navigator.reviewed.v1';
    const cards = Array.from(document.querySelectorAll('.stage-card'));
    const stageIds = new Set(cards.map(card => card.dataset.stage));
    const searchInput = document.querySelector('#stage-search');
    const filters = Array.from(document.querySelectorAll('[data-filter]'));
    const dialog = document.querySelector('#stage-dialog');
    const resetButton = document.querySelector('#reset-progress');
    const dialogReview = document.querySelector('#dialog-review');
    let reviewed = new Set();
    let activeFilter = 'all';
    let activeCard = null;
    let dialogTrigger = null;

    try {
        const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (Array.isArray(stored)) {
            reviewed = new Set(stored.filter(id => stageIds.has(id)));
        }
    } catch {
        document.querySelector('#storage-notice').hidden = false;
    }

    function saveProgress() {
        try {
            localStorage.setItem(storageKey, JSON.stringify([...reviewed]));
            document.querySelector('#storage-notice').hidden = true;
        } catch {
            document.querySelector('#storage-notice').hidden = false;
        }
    }

    function updateProgress() {
        const count = reviewed.size;
        document.querySelector('#progress-count').textContent = count;
        document.querySelector('#progress-percent').textContent = `${Math.round(count / cards.length * 100)}%`;
        const progress = document.querySelector('#journey-progress');
        progress.value = count;
        progress.textContent = `${count} iš ${cards.length}`;
        resetButton.disabled = count === 0;
        document.querySelector('#progress-hint').textContent = count === cards.length
            ? 'Visas kelias peržiūrėtas. Dabar metas tavo pačios ar paties projektui!'
            : count === 0
                ? 'Tavo kelionė prasideda čia. Pasirink pirmą etapą.'
                : 'Puiki pradžia. Tęsk savo tempu, progresas išsaugomas šioje naršyklėje.';

        cards.forEach(card => {
            const isReviewed = reviewed.has(card.dataset.stage);
            const button = card.querySelector('[data-review]');
            const title = card.querySelector('h3').textContent;
            card.classList.toggle('reviewed', isReviewed);
            button.setAttribute('aria-pressed', String(isReviewed));
            button.setAttribute('aria-label', isReviewed
                ? `Atžymėti peržiūrėtą etapą ${title}`
                : `Pažymėti etapą ${title} kaip peržiūrėtą`);
            button.title = isReviewed ? 'Peržiūrėta. Spausk, jei nori atžymėti.' : 'Pažymėti kaip peržiūrėtą';
        });
        if (activeCard) {
            const isReviewed = reviewed.has(activeCard.dataset.stage);
            dialogReview.querySelector('span').textContent = isReviewed
                ? 'Atžymėti peržiūrėtą etapą' : 'Pažymėti kaip peržiūrėtą';
            dialogReview.setAttribute('aria-pressed', String(isReviewed));
        }
    }

    function toggleReviewed(id) {
        if (reviewed.has(id)) reviewed.delete(id);
        else reviewed.add(id);
        saveProgress();
        updateProgress();
    }

    // Normalize Lithuanian diacritics so "kurimas" also matches "kūrimas".
    function normalize(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('lt');
    }

    const searchableText = new Map(cards.map(card => [card, normalize([
        card.querySelector('h3').textContent,
        card.querySelector('.category-tag').textContent,
        card.querySelector('.stage-description').textContent,
        card.querySelector('.stage-tips').textContent,
        card.querySelector('.detail-text').textContent,
        card.querySelector('.detail-example').textContent
    ].join(' '))]));

    function applyFilters() {
        const words = normalize(searchInput.value.trim()).split(/\s+/).filter(Boolean);
        let visible = 0;
        cards.forEach(card => {
            const matchesCategory = activeFilter === 'all' || card.dataset.category === activeFilter;
            const matchesSearch = words.every(word => searchableText.get(card).includes(word));
            card.hidden = !matchesCategory || !matchesSearch;
            if (!card.hidden) visible++;
        });
        filters.forEach(button => {
            const selected = button.dataset.filter === activeFilter;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
        document.querySelector('#empty-state').hidden = visible !== 0;
        document.querySelector('#search-status').textContent = `Rodoma etapų: ${visible} iš ${cards.length}.`;
    }

    function openStage(card, trigger) {
        activeCard = card;
        dialogTrigger = trigger;
        const number = cards.indexOf(card) + 1;
        document.querySelector('#dialog-title').textContent = card.querySelector('h3').textContent;
        document.querySelector('#dialog-eyebrow').textContent = `0${number} / ${card.querySelector('.category-tag').textContent.trim()}`;
        document.querySelector('#dialog-description').textContent = card.querySelector('.stage-description').textContent;
        document.querySelector('#dialog-detail').textContent = card.querySelector('.detail-text').textContent;
        document.querySelector('#dialog-example').textContent = card.querySelector('.detail-example').textContent;
        document.querySelector('#dialog-position').textContent = `${number} iš ${cards.length} etapų · Tavo kūrimo kelias`;
        document.querySelector('#copy-example').textContent = 'Kopijuoti';
        document.querySelector('#copy-status').textContent = '';
        document.querySelector('#copy-status').classList.add('sr-only');
        updateProgress();
        dialog.showModal();
        dialog.scrollTop = 0;
        document.body.classList.add('dialog-open');
        document.querySelector('#dialog-close').focus();
    }

    cards.forEach(card => {
        const trigger = card.querySelector('[data-open]');
        trigger.addEventListener('click', () => openStage(card, trigger));
        card.querySelector('[data-review]').addEventListener('click', () => toggleReviewed(card.dataset.stage));
    });

    filters.forEach(button => button.addEventListener('click', () => {
        activeFilter = button.dataset.filter;
        applyFilters();
    }));
    searchInput.addEventListener('input', applyFilters);
    document.querySelector('#clear-filters').addEventListener('click', () => {
        searchInput.value = '';
        activeFilter = 'all';
        applyFilters();
        searchInput.focus();
    });
    resetButton.addEventListener('click', () => {
        if (!window.confirm('Iš naujo pradėti kelionę ir išvalyti visų etapų peržiūros progresą?')) return;
        reviewed.clear();
        saveProgress();
        updateProgress();
    });

    document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
        document.body.classList.remove('dialog-open');
        activeCard = null;
        dialogTrigger?.focus();
    });
    dialogReview.addEventListener('click', () => {
        if (activeCard) toggleReviewed(activeCard.dataset.stage);
    });
    document.querySelector('#copy-example').addEventListener('click', async () => {
        const status = document.querySelector('#copy-status');
        try {
            await navigator.clipboard.writeText(document.querySelector('#dialog-example').textContent);
            document.querySelector('#copy-example').textContent = 'Nukopijuota';
            status.textContent = 'Pavyzdys nukopijuotas į iškarpinę.';
        } catch {
            status.classList.remove('sr-only');
            status.textContent = 'Automatinis kopijavimas neprieinamas. Pažymėk pavyzdžio tekstą ir nukopijuok jį rankiniu būdu.';
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === '/' && !dialog.open && !event.ctrlKey && !event.metaKey && !event.altKey &&
            !event.target.matches('input, textarea, select, [contenteditable]')) {
            event.preventDefault();
            searchInput.focus();
        }
    });
    window.addEventListener('storage', event => {
        if (event.key !== storageKey && event.key !== null) return;
        try {
            const stored = event.newValue ? JSON.parse(event.newValue) : [];
            reviewed = new Set(Array.isArray(stored) ? stored.filter(id => stageIds.has(id)) : []);
            updateProgress();
        } catch {
            // An invalid value from another tab must not interrupt the current session.
        }
    });

    updateProgress();
    applyFilters();
    document.documentElement.classList.add('js-ready');
})();
