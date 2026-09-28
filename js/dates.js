/* GateOS — date helpers */
window.GateOS = window.GateOS || {};

GateOS.Dates = {
    todayISO() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },

    addDaysISO(iso, n) {
        const d = new Date(iso + 'T00:00:00');
        d.setDate(d.getDate() + n);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },

    daysBetween(a, b) {
        return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
    },

    getTodayLabel() {
        return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
            ' · ' + new Date().toLocaleDateString('en-IN', { weekday: 'long' });
    },

    monthPrefix(iso) {
        return iso.slice(0, 7);
    }
};
