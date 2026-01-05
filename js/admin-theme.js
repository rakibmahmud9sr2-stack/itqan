(function () {
    function apply(theme) {
        if (!theme) return;
        for (const [key, value] of Object.entries(theme)) {
            document.documentElement.style.setProperty(key, value);
        }
    }
    try {
        const cached = localStorage.getItem('adminTheme');
        if (cached) apply(JSON.parse(cached));
    } catch (e) { console.error('Error loading cached theme:', e); }

    window.addEventListener('load', () => {
        console.log('Theme script running');
        fetch('/api/settings', { credentials: 'include' })
            .then(r => r.json())
            .then(s => {
                if (s.theme) {
                    apply(s.theme);
                    localStorage.setItem('adminTheme', JSON.stringify(s.theme));
                }
            })
            .catch(e => console.error('Error fetching theme:', e));
    });
})();
