/* GateOS — shared core helpers */
window.GateOS = window.GateOS || {};

GateOS.scheduleRevision = function scheduleRevision(topic, baseISO, dayOffsets) {
    dayOffsets.forEach(days => {
        const dueDate = GateOS.Dates.addDaysISO(baseISO, days);
        const exists = GateOS.data.revisions.some(r => r.topic === topic && r.days === days);
        if (!exists) {
            GateOS.data.revisions.push({
                id: GateOS.getNextId(),
                topic,
                days,
                dueDate,
                done: false,
            });
        }
    });
};

GateOS.revisionStatus = function revisionStatus(r) {
    if (r.done) return { cls: 'status-done', label: '✅ Done' };
    const today = GateOS.Dates.todayISO();
    const due = r.dueDate || today;
    if (due < today) return { cls: 'status-overdue', label: '⏳ Overdue' };
    if (due === today) return { cls: 'status-today', label: '📍 Due Today' };
    return { cls: 'status-upcoming', label: 'Upcoming · ' + due };
};

GateOS.computeStreak = function computeStreak() {
    let streak = 0;
    let cursor = GateOS.Dates.todayISO();
    while (true) {
        const t = GateOS.data.taskLog[cursor];
        const h = GateOS.data.habitLog[cursor];
        const p = GateOS.data.planLog[cursor];
        const sessionMins = GateOS.Sessions.totalMinutes(GateOS.Sessions.sessionsForDate(cursor));
        const planActive = p && p.items.some(it => GateOS.Planner.isPlanItemDone(it));
        const active = (t && Object.values(t).some(Boolean)) ||
            (h && Object.values(h).some(Boolean)) ||
            planActive ||
            sessionMins > 0;
        if (active) {
            streak++;
            cursor = GateOS.Dates.addDaysISO(cursor, -1);
        } else break;
    }
    return streak;
};
