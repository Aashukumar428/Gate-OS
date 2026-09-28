/* GateOS — Lecture Engine */
window.GateOS = window.GateOS || {};

GateOS.LectureEngine = {
    SUBJECT_ALIASES: {
        'Operating System': 'OS',
        OS: 'OS',
    },

    normalizeName(name) {
        return this.SUBJECT_ALIASES[name] || name;
    },

    migrateSubject(sub) {
        if (sub.history && sub.currentLecture != null) {
            sub.done = sub.history.length;
            return sub;
        }

        const done = sub.done || 0;
        sub.currentLecture = done + 1;
        sub.timeSpentMinutes = sub.timeSpentMinutes || 0;
        sub.notesCompleted = sub.notesCompleted || 0;
        sub.pyqsCompleted = sub.pyqsCompleted || 0;
        sub.confidence = sub.confidence || 5;
        sub.history = sub.history || [];

        if (sub.history.length === 0 && done > 0) {
            for (let i = 1; i <= done; i++) {
                sub.history.push({
                    lectureNumber: i,
                    completedDate: GateOS.Dates.todayISO(),
                    notesDone: false,
                    pyqsDone: false,
                    confidence: 5,
                    timeMinutes: 0,
                });
            }
        }

        sub.done = sub.history.length;
        sub.currentLecture = Math.min(sub.total + 1, sub.history.length + 1);
        return sub;
    },

    autoProgress(sub) {
        if (!sub || !sub.total) return 0;
        const completed = sub.history ? sub.history.length : (sub.done || 0);
        return Math.round((completed / sub.total) * 100);
    },

    isComplete(sub) {
        return sub.currentLecture > sub.total || (sub.history && sub.history.length >= sub.total);
    },

    getCurrentLecture(sub) {
        if (this.isComplete(sub)) return sub.total;
        return sub.currentLecture || (sub.history ? sub.history.length + 1 : 1);
    },

    syncDone(sub) {
        sub.done = sub.history ? sub.history.length : 0;
        if (sub.done >= sub.total) {
            sub.currentLecture = sub.total + 1;
        } else {
            sub.currentLecture = sub.done + 1;
        }
    },

    completeLecture(sub, meta) {
        if (!sub || this.isComplete(sub)) return false;

        const lectureNumber = this.getCurrentLecture(sub);
        const entry = {
            lectureNumber,
            completedDate: GateOS.Dates.todayISO(),
            notesDone: !!meta.notesDone,
            pyqsDone: !!meta.pyqsDone,
            confidence: Math.max(1, Math.min(10, parseInt(meta.confidence, 10) || sub.confidence || 5)),
            timeMinutes: Math.max(0, parseInt(meta.timeMinutes, 10) || 0),
        };

        if (!sub.history) sub.history = [];
        sub.history.push(entry);
        sub.confidence = entry.confidence;
        if (entry.notesDone) sub.notesCompleted = (sub.notesCompleted || 0) + 1;
        if (entry.pyqsDone) sub.pyqsCompleted = (sub.pyqsCompleted || 0) + 1;
        sub.timeSpentMinutes = (sub.timeSpentMinutes || 0) + entry.timeMinutes;

        this.syncDone(sub);

        if (sub.done === sub.total) {
            GateOS.scheduleRevision(sub.name + ' (Full Revision)', GateOS.Dates.todayISO(), [1, 7, 30, 60, 120]);
        }

        GateOS.Planner.clearOverdueForSubject(sub.id, lectureNumber);
        return true;
    },

    undoLastLecture(sub) {
        if (!sub.history || sub.history.length === 0) return false;
        const last = sub.history.pop();
        if (last.notesDone) sub.notesCompleted = Math.max(0, (sub.notesCompleted || 0) - 1);
        if (last.pyqsDone) sub.pyqsCompleted = Math.max(0, (sub.pyqsCompleted || 0) - 1);
        sub.timeSpentMinutes = Math.max(0, (sub.timeSpentMinutes || 0) - (last.timeMinutes || 0));
        this.syncDone(sub);
        return true;
    },

    addTimeMinutes(sub, minutes) {
        sub.timeSpentMinutes = (sub.timeSpentMinutes || 0) + Math.max(0, minutes);
    },

    weightedProgress(subjects) {
        const totalW = subjects.reduce((s, sub) => s + (sub.weight || 1), 0);
        const weightedDone = subjects.reduce((s, sub) => {
            const pct = sub.total > 0 ? this.autoProgress(sub) / 100 : 0;
            return s + pct * (sub.weight || 1);
        }, 0);
        return totalW > 0 ? Math.round((weightedDone / totalW) * 100) : 0;
    },

    findByName(name) {
        const norm = this.normalizeName(name);
        return GateOS.data.subjects.find(s => this.normalizeName(s.name) === norm);
    },
};
