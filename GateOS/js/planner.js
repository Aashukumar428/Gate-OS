/* GateOS — Daily Study Generator / Planner */
window.GateOS = window.GateOS || {};

GateOS.Planner = {
    LECTURE_MINUTES: 45,
    CODING_MINUTES: 25,
    COLLEGE_DAYS: [1, 3, 5],
    PRIORITY_SUBJECTS: ['DBMS', 'OS', 'Algorithms'],
    SECONDARY_SUBJECTS: ['CN', 'COA', 'TOC', 'Compiler'],

    isCollegeDay(iso) {
        return this.COLLEGE_DAYS.includes(new Date(iso + 'T00:00:00').getDay());
    },

    dayBudgetMinutes(iso) {
        return this.isCollegeDay(iso) ? 210 : 330;
    },

    dsaMinutes(difficulty) {
        return difficulty === 'Easy' ? 20 : difficulty === 'Hard' ? 50 : 35;
    },

    formatMinutes(total) {
        const h = Math.floor(total / 60);
        const m = total % 60;
        if (h === 0) return m + 'm';
        if (m === 0) return h + 'h';
        return h + 'h ' + m + 'm';
    },

    getMostRecentPlanDateBefore(t) {
        const dates = Object.keys(GateOS.data.planLog).filter(d => d < t).sort();
        return dates.length ? dates[dates.length - 1] : null;
    },

    isPlanItemDone(item) {
        if (item.type === 'subject') {
            const sub = GateOS.data.subjects.find(s => s.id === item.targetId);
            return sub ? sub.history.length >= item.lectureIndex : true;
        }
        if (item.type === 'dsa') {
            const v = GateOS.data.dsaVideos.find(x => x.id === item.targetId);
            return v ? v.done : true;
        }
        if (item.type === 'coding') {
            const p = GateOS.data.codingProblems.find(x => x.id === item.targetId);
            return p ? p.done : true;
        }
        return !!item.done;
    },

    markOverdue(item, fromDate) {
        if (item.type !== 'subject') return;
        const key = item.targetId + ':' + item.lectureIndex;
        if (!GateOS.data.overdueLectures[key]) {
            GateOS.data.overdueLectures[key] = {
                subjectId: item.targetId,
                lectureIndex: item.lectureIndex,
                label: item.label,
                since: fromDate,
            };
        }
    },

    clearOverdueForSubject(subjectId, lectureIndex) {
        const key = subjectId + ':' + lectureIndex;
        delete GateOS.data.overdueLectures[key];
    },

    getOverdueList() {
        return Object.values(GateOS.data.overdueLectures || {});
    },

    orderedSubjects() {
        const LE = GateOS.LectureEngine;
        const byName = name => LE.findByName(name);
        const priority = this.PRIORITY_SUBJECTS.map(byName).filter(Boolean);
        const secondary = this.SECONDARY_SUBJECTS.map(byName).filter(Boolean);
        const used = new Set([...priority, ...secondary].map(s => s.id));
        const rest = GateOS.data.subjects.filter(s => !used.has(s.id));
        return [...priority, ...secondary, ...rest];
    },

    buildTodayPlan() {
        const t = GateOS.Dates.todayISO();
        if (GateOS.data.planLog[t]) return;

        const budget = this.dayBudgetMinutes(t);
        let remaining = budget;
        const items = [];
        const covered = new Set();

        const prevDate = this.getMostRecentPlanDateBefore(t);
        if (prevDate && GateOS.data.planLog[prevDate]) {
            GateOS.data.planLog[prevDate].items.forEach(it => {
                if (this.isPlanItemDone(it)) return;
                this.markOverdue(it, prevDate);
                const key = it.type + ':' + it.targetId + (it.lectureIndex || '');
                if (it.type !== 'revision') {
                    if (covered.has(key)) return;
                    covered.add(key);
                }
                items.push({
                    id: GateOS.getNextId(),
                    type: it.type,
                    targetId: it.targetId,
                    lectureIndex: it.lectureIndex,
                    label: it.label,
                    minutes: it.minutes,
                    carried: true,
                    overdue: true,
                    done: false,
                });
                remaining -= it.minutes;
            });
        }

        const LE = GateOS.LectureEngine;
        const pipeline = [];

        this.PRIORITY_SUBJECTS.forEach(name => {
            const sub = LE.findByName(name);
            if (sub && !LE.isComplete(sub)) pipeline.push({ kind: 'subject', sub, priority: true });
        });

        const nextDsa = GateOS.data.dsaVideos.find(v => !v.done);
        if (nextDsa) pipeline.push({ kind: 'dsa', video: nextDsa, priority: true });

        this.SECONDARY_SUBJECTS.forEach(name => {
            const sub = LE.findByName(name);
            if (sub && !LE.isComplete(sub)) pipeline.push({ kind: 'subject', sub, priority: false });
        });

        GateOS.data.subjects.forEach(sub => {
            const inPipeline = [...this.PRIORITY_SUBJECTS, ...this.SECONDARY_SUBJECTS]
                .some(n => LE.normalizeName(n) === LE.normalizeName(sub.name));
            if (!inPipeline && !LE.isComplete(sub)) {
                pipeline.push({ kind: 'subject', sub, priority: false });
            }
        });

        pipeline.forEach(entry => {
            if (entry.kind === 'subject') {
                const sub = entry.sub;
                const key = 'subject:' + sub.id;
                if (covered.has(key) || LE.isComplete(sub)) return;
                if (remaining < this.LECTURE_MINUTES && items.length > 0) return;

                const lectureIndex = LE.getCurrentLecture(sub);
                covered.add(key);
                items.push({
                    id: GateOS.getNextId(),
                    type: 'subject',
                    targetId: sub.id,
                    lectureIndex,
                    label: sub.name + ' — Lecture ' + lectureIndex,
                    minutes: this.LECTURE_MINUTES,
                    carried: false,
                    priority: entry.priority,
                });
                remaining -= this.LECTURE_MINUTES;
            } else if (entry.kind === 'dsa') {
                const v = entry.video;
                const key = 'dsa:' + v.id;
                if (covered.has(key) || v.done) return;
                if (remaining <= 0 && items.length > 0) return;

                const minutes = this.dsaMinutes(v.difficulty);
                items.push({
                    id: GateOS.getNextId(),
                    type: 'dsa',
                    targetId: v.id,
                    label: 'DSA — ' + v.title,
                    minutes,
                    carried: false,
                    priority: true,
                });
                remaining -= minutes;
                covered.add(key);
            }
        });

        const nextCoding = GateOS.data.codingProblems.find(p => !p.done && !covered.has('coding:' + p.id));
        if (nextCoding && (remaining > 0 || items.length === 0)) {
            items.push({
                id: GateOS.getNextId(),
                type: 'coding',
                targetId: nextCoding.id,
                label: 'Coding — ' + nextCoding.title,
                minutes: this.CODING_MINUTES,
                carried: false,
            });
            remaining -= this.CODING_MINUTES;
            covered.add('coding:' + nextCoding.id);
        }

        const dueCount = GateOS.data.revisions.filter(r => !r.done && (r.dueDate || t) <= t).length;
        if (dueCount > 0) {
            items.push({
                id: GateOS.getNextId(),
                type: 'revision',
                label: 'Revise ' + dueCount + ' due topic' + (dueCount > 1 ? 's' : ''),
                minutes: 20,
                done: false,
                carried: false,
            });
        }

        items.sort((a, b) => {
            if (a.overdue && !b.overdue) return -1;
            if (!a.overdue && b.overdue) return 1;
            if (a.priority && !b.priority) return -1;
            if (!a.priority && b.priority) return 1;
            return 0;
        });

        GateOS.data.planLog[t] = { items, budget, generatedDate: t };
    },

    getMissionSummary(t) {
        const plan = GateOS.data.planLog[t];
        if (!plan) return { totalMinutes: 0, itemCount: 0, overdueCount: 0 };
        const overdueCount = plan.items.filter(it => it.overdue && !this.isPlanItemDone(it)).length;
        const totalMinutes = plan.items.reduce((s, it) => s + it.minutes, 0);
        return { totalMinutes, itemCount: plan.items.length, overdueCount };
    },

    togglePlanItem(id) {
        const t = GateOS.Dates.todayISO();
        const plan = GateOS.data.planLog[t];
        if (!plan) return;

        const item = plan.items.find(i => i.id === id);
        if (!item) return;

        if (item.type === 'subject') {
            const sub = GateOS.data.subjects.find(s => s.id === item.targetId);
            if (!sub) return;
            if (this.isPlanItemDone(item)) {
                GateOS.LectureEngine.undoLastLecture(sub);
            } else {
                GateOS.LectureEngine.completeLecture(sub, {
                    notesDone: false,
                    pyqsDone: false,
                    confidence: sub.confidence || 5,
                    timeMinutes: 0,
                });
            }
        } else if (item.type === 'dsa') {
            const v = GateOS.data.dsaVideos.find(x => x.id === item.targetId);
            if (!v) return;
            v.done = !v.done;
            if (v.done) GateOS.scheduleRevision(v.title, t, [1, 7]);
        } else if (item.type === 'coding') {
            const p = GateOS.data.codingProblems.find(x => x.id === item.targetId);
            if (!p) return;
            p.done = !p.done;
        } else {
            item.done = !item.done;
        }

        GateOS.ensureTodayLogs();
        GateOS.saveData();
        GateOS.Render.renderAll();
    },
};
