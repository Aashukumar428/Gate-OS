/* GateOS — Study Sessions */
window.GateOS = window.GateOS || {};

GateOS.Sessions = {
    timerInterval: null,

    getActive() {
        return GateOS.data.activeSession;
    },

    start(subjectId) {
        if (GateOS.data.activeSession) {
            alert('Finish or cancel the current session first.');
            return;
        }

        const sub = GateOS.data.subjects.find(s => s.id === subjectId);
        if (!sub) return alert('Select a subject');

        const lectureNumber = GateOS.LectureEngine.getCurrentLecture(sub);
        if (GateOS.LectureEngine.isComplete(sub)) {
            return alert('All lectures completed for this subject.');
        }

        GateOS.data.activeSession = {
            id: GateOS.getNextId(),
            subjectId: sub.id,
            subjectName: sub.name,
            lectureNumber,
            startTime: Date.now(),
            pausedAt: null,
            totalPausedMs: 0,
            status: 'active',
        };

        GateOS.saveData();
        this.startTimer();
        GateOS.Render.renderSession();
    },

    pause() {
        const s = GateOS.data.activeSession;
        if (!s || s.status !== 'active') return;

        s.status = 'paused';
        s.pausedAt = Date.now();
        this.stopTimer();
        GateOS.saveData();
        GateOS.Render.renderSession();
    },

    resume() {
        const s = GateOS.data.activeSession;
        if (!s || s.status !== 'paused' || !s.pausedAt) return;

        s.totalPausedMs += Date.now() - s.pausedAt;
        s.pausedAt = null;
        s.status = 'active';
        this.startTimer();
        GateOS.saveData();
        GateOS.Render.renderSession();
    },

    finish() {
        const s = GateOS.data.activeSession;
        if (!s) return;

        let elapsed = Date.now() - s.startTime - (s.totalPausedMs || 0);
        if (s.status === 'paused' && s.pausedAt) {
            elapsed -= Date.now() - s.pausedAt;
        }

        const durationMinutes = Math.max(1, Math.round(elapsed / 60000));
        const date = GateOS.Dates.todayISO();

        GateOS.data.sessions.push({
            id: s.id,
            subjectId: s.subjectId,
            subjectName: s.subjectName,
            lectureNumber: s.lectureNumber,
            startTime: s.startTime,
            endTime: Date.now(),
            durationMinutes,
            date,
        });

        const sub = GateOS.data.subjects.find(x => x.id === s.subjectId);
        if (sub) GateOS.LectureEngine.addTimeMinutes(sub, durationMinutes);

        GateOS.data.activeSession = null;
        this.stopTimer();
        GateOS.saveData();
        GateOS.Render.renderAll();
    },

    cancel() {
        GateOS.data.activeSession = null;
        this.stopTimer();
        GateOS.saveData();
        GateOS.Render.renderSession();
    },

    elapsedMs() {
        const s = GateOS.data.activeSession;
        if (!s) return 0;

        let elapsed = Date.now() - s.startTime - (s.totalPausedMs || 0);
        if (s.status === 'paused' && s.pausedAt) {
            elapsed -= Date.now() - s.pausedAt;
        }
        return Math.max(0, elapsed);
    },

    formatElapsed(ms) {
        const totalSec = Math.floor(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const sec = totalSec % 60;
        return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
    },

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            const el = document.getElementById('sessionTimer');
            if (el) el.textContent = this.formatElapsed(this.elapsedMs());
        }, 1000);
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    sessionsForDate(iso) {
        return (GateOS.data.sessions || []).filter(s => s.date === iso);
    },

    sessionsInRange(startISO, endISO) {
        return (GateOS.data.sessions || []).filter(s => s.date >= startISO && s.date <= endISO);
    },

    totalMinutes(sessions) {
        return sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    },

    hoursLabel(minutes) {
        return (minutes / 60).toFixed(1) + 'h';
    },
};
