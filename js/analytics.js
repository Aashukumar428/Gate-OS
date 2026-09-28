/* GateOS — Analytics (hours, streaks, pace) */
window.GateOS = window.GateOS || {};

GateOS.Analytics = {
    dailyHours(iso) {
        const mins = GateOS.Sessions.totalMinutes(GateOS.Sessions.sessionsForDate(iso));
        return mins / 60;
    },

    weeklyHours(endISO) {
        const start = GateOS.Dates.addDaysISO(endISO, -6);
        const sessions = GateOS.Sessions.sessionsInRange(start, endISO);
        return GateOS.Sessions.totalMinutes(sessions) / 60;
    },

    monthlyHours(iso) {
        const prefix = GateOS.Dates.monthPrefix(iso);
        const sessions = (GateOS.data.sessions || []).filter(s => s.date.startsWith(prefix));
        return GateOS.Sessions.totalMinutes(sessions) / 60;
    },

    subjectWiseHours() {
        const map = {};
        (GateOS.data.sessions || []).forEach(s => {
            const key = s.subjectName || 'Other';
            map[key] = (map[key] || 0) + (s.durationMinutes || 0);
        });
        return Object.entries(map)
            .map(([name, minutes]) => ({ name, hours: minutes / 60 }))
            .sort((a, b) => b.hours - a.hours);
    },

    averageSessionLength() {
        const sessions = GateOS.data.sessions || [];
        if (!sessions.length) return 0;
        const total = GateOS.Sessions.totalMinutes(sessions);
        return total / sessions.length;
    },

    longestStudyStreak() {
        const byDate = {};
        (GateOS.data.sessions || []).forEach(s => {
            byDate[s.date] = (byDate[s.date] || 0) + (s.durationMinutes || 0);
        });

        const dates = Object.keys(byDate).sort();
        if (!dates.length) return 0;

        let longest = 0;
        let current = 0;
        let prev = null;

        dates.forEach(d => {
            if (byDate[d] <= 0) return;
            if (prev && GateOS.Dates.daysBetween(prev, d) === 1) {
                current++;
            } else {
                current = 1;
            }
            longest = Math.max(longest, current);
            prev = d;
        });

        return longest;
    },

    renderPaceETA(listKey, progressKey, total, paceElId, etaElId, miniElId) {
        const t = GateOS.Dates.todayISO();
        const doneNow = GateOS.data[listKey].filter(x => x.done).length;
        const logDates = Object.keys(GateOS.data.progressLog).sort();
        let startDate = null;
        let startVal = null;

        for (const d of logDates) {
            if (GateOS.Dates.daysBetween(d, t) <= 13 && GateOS.Dates.daysBetween(d, t) >= 0) {
                startDate = d;
                startVal = GateOS.data.progressLog[d][progressKey];
                break;
            }
        }

        const paceEl = document.getElementById(paceElId);
        const etaEl = document.getElementById(etaElId);
        const miniEl = document.getElementById(miniElId);

        if (!paceEl || !etaEl) return;

        if (!startDate || startDate === t) {
            paceEl.textContent = 'Gathering data…';
            etaEl.textContent = 'Keep using the tracker daily';
            if (miniEl) miniEl.textContent = '';
            return;
        }

        const elapsedDays = Math.max(1, GateOS.Dates.daysBetween(startDate, t));
        const gained = doneNow - (startVal || 0);
        const pace = gained / elapsedDays;
        const remaining = total - doneNow;

        if (pace <= 0) {
            paceEl.textContent = '0 / day';
            etaEl.textContent = remaining > 0 ? 'No recent progress' : '🎉 Complete!';
            if (miniEl) miniEl.textContent = '';
            return;
        }

        paceEl.textContent = pace.toFixed(2) + ' / day';
        if (remaining <= 0) {
            etaEl.textContent = '🎉 Complete!';
            if (miniEl) miniEl.textContent = 'Done!';
        } else {
            const daysNeeded = Math.ceil(remaining / pace);
            const etaDate = GateOS.Dates.addDaysISO(t, daysNeeded);
            etaEl.textContent = etaDate + ' (' + daysNeeded + ' days)';
            if (miniEl) miniEl.textContent = 'ETA ' + etaDate;
        }
    },

    renderActivityChart() {
        const t = GateOS.Dates.todayISO();
        const days = [];
        for (let i = 6; i >= 0; i--) days.push(GateOS.Dates.addDaysISO(t, -i));

        const counts = days.map(d => {
            const tl = GateOS.data.taskLog[d] || {};
            const hl = GateOS.data.habitLog[d] || {};
            const sessionMins = GateOS.Sessions.totalMinutes(GateOS.Sessions.sessionsForDate(d));
            return Object.values(tl).filter(Boolean).length +
                Object.values(hl).filter(Boolean).length +
                Math.floor(sessionMins / 30);
        });

        const max = Math.max(1, ...counts);
        const chart = document.getElementById('activityChart');
        if (!chart) return;

        chart.innerHTML = days.map((d, i) => {
            const h = Math.round((counts[i] / max) * 100);
            const label = new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' });
            return '<div class="bar-col"><div class="bar-fill" style="height:' + Math.max(4, h) + '%;" title="' + counts[i] + ' activity"></div><div class="bar-label">' + label + '</div></div>';
        }).join('');
    },

    renderHoursPanel() {
        const t = GateOS.Dates.todayISO();
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        const dailyMins = GateOS.Sessions.totalMinutes(GateOS.Sessions.sessionsForDate(t));
        const weeklyMins = GateOS.Sessions.totalMinutes(
            GateOS.Sessions.sessionsInRange(GateOS.Dates.addDaysISO(t, -6), t)
        );
        const monthlyMins = GateOS.Sessions.totalMinutes(
            (GateOS.data.sessions || []).filter(s => s.date.startsWith(GateOS.Dates.monthPrefix(t)))
        );

        set('dailyHours', GateOS.Sessions.hoursLabel(dailyMins));
        set('weeklyHours', GateOS.Sessions.hoursLabel(weeklyMins));
        set('monthlyHours', GateOS.Sessions.hoursLabel(monthlyMins));

        const avg = this.averageSessionLength();
        set('avgSessionLen', avg ? Math.round(avg) + ' min' : '—');

        const streak = this.longestStudyStreak();
        set('longestStudyStreak', streak ? streak + ' days' : '—');

        const container = document.getElementById('subjectHoursList');
        if (!container) return;

        const rows = this.subjectWiseHours();
        if (!rows.length) {
            container.innerHTML = '<div class="empty">No study sessions logged yet.</div>';
            return;
        }

        container.innerHTML = rows.map(r => {
            const pct = Math.min(100, Math.round((r.hours / Math.max(rows[0].hours, 0.1)) * 100));
            return '<div class="subject-row">' +
                '<span class="name">' + r.name + '</span>' +
                '<div class="status">' +
                '<span class="count">' + r.hours.toFixed(1) + 'h</span>' +
                '<div class="progress-track"><div class="progress-fill gold" style="width:' + pct + '%;"></div></div>' +
                '</div></div>';
        }).join('');
    },
};
