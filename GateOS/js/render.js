/* GateOS — render layer */
window.GateOS = window.GateOS || {};

GateOS.Render = {
    renderAll() {
        GateOS.ensureTodayLogs();
        this.renderStats();
        this.renderSubjects();
        this.renderDSA();
        this.renderCoding();
        this.renderRevisions();
        this.renderMocks();
        this.renderHabits();
        this.renderBacklog();
        this.renderToday();
        this.renderPlan();
        this.renderSession();
        this.renderAnalytics();
    },

    renderStats() {
        const t = GateOS.Dates.todayISO();
        document.getElementById('daysLeft').textContent = Math.max(0, GateOS.Dates.daysBetween(t, GateOS.data.examDate));
        document.getElementById('examDateNote').textContent = 'Target: ' + GateOS.data.examDate;
        document.getElementById('examDateInput').value = GateOS.data.examDate;

        document.getElementById('avgProgress').textContent = GateOS.LectureEngine.weightedProgress(GateOS.data.subjects) + '%';

        const dsaDone = GateOS.data.dsaVideos.filter(v => v.done).length;
        document.getElementById('dsaCount').textContent = dsaDone + ' / ' + GateOS.data.dsaVideos.length;
        document.getElementById('dsaCounter').textContent = dsaDone + ' / ' + GateOS.data.dsaVideos.length + ' done';

        const codingDone = GateOS.data.codingProblems.filter(p => p.done).length;
        document.getElementById('codingCount').textContent = codingDone + ' / ' + GateOS.data.codingProblems.length;
        document.getElementById('codingCounter').textContent = codingDone + ' / ' + GateOS.data.codingProblems.length + ' done';

        for (const days of [1, 7, 30, 60, 120]) {
            const count = GateOS.data.revisions.filter(r => r.days === days && r.done).length;
            const el = document.getElementById('rev' + days);
            if (el) el.textContent = count;
        }

        document.getElementById('streakBadge').textContent = '🔥 ' + GateOS.computeStreak() + '-day streak';
        document.getElementById('headerDate').textContent = GateOS.Dates.getTodayLabel();
        document.getElementById('weeklyGoalInput').value = GateOS.data.weeklyGoal || '';
    },

    renderSubjects() {
        const LE = GateOS.LectureEngine;
        const container = document.getElementById('subjectList');
        container.innerHTML = GateOS.data.subjects.map(sub => {
            const pct = LE.autoProgress(sub);
            const cur = LE.getCurrentLecture(sub);
            const complete = LE.isComplete(sub);
            const historyHtml = (sub.history || []).slice(-3).reverse().map(h =>
                '<span class="tag" style="font-size:0.65rem;">L' + h.lectureNumber +
                (h.notesDone ? ' 📝' : '') + (h.pyqsDone ? ' 📋' : '') +
                ' · ' + h.confidence + '/10</span>'
            ).join(' ');

            return '<div class="subject-block" style="border-bottom:1px solid #f0f3f8;padding:10px 0;">' +
                '<div class="subject-row" style="border:none;padding:0;">' +
                '<span class="name">' + sub.name + '</span>' +
                '<div class="status">' +
                '<span class="weight-label">wt</span>' +
                '<input class="weight-input" type="number" min="1" max="10" value="' + (sub.weight || 1) + '" onchange="updateWeight(' + sub.id + ', this.value)" />' +
                '<span class="count">' + (complete ? sub.total : cur) + '/' + sub.total + '</span>' +
                '<div class="progress-track"><div class="progress-fill ' + (pct >= 80 ? 'gold' : '') + '" style="width:' + pct + '%;"></div></div>' +
                '<button class="btn btn-primary btn-sm" onclick="incrementSubject(' + sub.id + ')">+1</button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteSubject(' + sub.id + ')">✕</button>' +
                '</div></div>' +
                '<div class="lecture-meta mt-8" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:0.78rem;">' +
                '<span class="text-muted">⏱ ' + (sub.timeSpentMinutes || 0) + 'm</span>' +
                '<span class="text-muted">📝 ' + (sub.notesCompleted || 0) + '</span>' +
                '<span class="text-muted">📋 ' + (sub.pyqsCompleted || 0) + '</span>' +
                '<label><input type="checkbox" id="notes_' + sub.id + '" ' + (complete ? 'disabled' : '') + ' /> Notes</label>' +
                '<label><input type="checkbox" id="pyqs_' + sub.id + '" ' + (complete ? 'disabled' : '') + ' /> PYQs</label>' +
                '<span>Conf <input class="weight-input" type="number" min="1" max="10" id="conf_' + sub.id + '" value="' + (sub.confidence || 5) + '" style="width:36px;" /></span>' +
                '<button class="btn btn-gold btn-sm" onclick="completeLecture(' + sub.id + ')" ' + (complete ? 'disabled' : '') + '>Complete Lec</button>' +
                '</div>' +
                (historyHtml ? '<div class="mt-8">' + historyHtml + '</div>' : '') +
                '</div>';
        }).join('');

        const backlogSelect = document.getElementById('newBacklogSubject');
        backlogSelect.innerHTML = GateOS.data.subjects.map(s => '<option value="' + s.name + '">' + s.name + '</option>').join('') +
            '<option value="DSA">DSA</option>';
    },

    renderDSA() {
        const tbody = document.getElementById('dsaBody');
        tbody.innerHTML = GateOS.data.dsaVideos.map((v, idx) =>
            '<tr class="' + (v.done ? 'done-row' : '') + '">' +
            '<td>' + (idx + 1) + '</td>' +
            '<td>' + v.title + '</td>' +
            '<td><input type="checkbox" ' + (v.done ? 'checked' : '') + ' onchange="toggleDSA(' + v.id + ')" /></td>' +
            '<td><span style="font-size:0.7rem;background:#f0f3f8;padding:2px 10px;border-radius:40px;">' + v.difficulty + '</span></td>' +
            '<td><button style="background:none;border:none;color:#c3ccd8;cursor:pointer;" onclick="deleteDsa(' + v.id + ')">✕</button></td>' +
            '</tr>'
        ).join('');
    },

    renderCoding() {
        const tbody = document.getElementById('codingBody');
        tbody.innerHTML = GateOS.data.codingProblems.map((p, idx) =>
            '<tr class="' + (p.done ? 'done-row' : '') + '">' +
            '<td>' + (idx + 1) + '</td>' +
            '<td>' + p.title + '</td>' +
            '<td><span style="font-size:0.7rem;background:#f0f3f8;padding:2px 10px;border-radius:40px;">' + p.platform + '</span></td>' +
            '<td><span style="font-size:0.7rem;">' + (p.topic || '—') + '</span></td>' +
            '<td><input type="text" value="' + (p.time || '') + '" placeholder="min" style="width:50px;border:1px solid #e6ecf5;border-radius:6px;padding:4px;font-size:0.8rem;" onchange="updateCodingTime(' + p.id + ', this.value)" /></td>' +
            '<td><input type="checkbox" ' + (p.done ? 'checked' : '') + ' onchange="toggleCoding(' + p.id + ')" /></td>' +
            '<td><button style="background:none;border:none;color:#c3ccd8;cursor:pointer;" onclick="deleteCoding(' + p.id + ')">✕</button></td>' +
            '</tr>'
        ).join('');
    },

    renderRevisions() {
        const container = document.getElementById('revisionList');
        if (GateOS.data.revisions.length === 0) {
            container.innerHTML = '<div class="empty">No revision items yet.</div>';
            return;
        }
        const sorted = [...GateOS.data.revisions].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
        container.innerHTML = sorted.map(r => {
            const st = GateOS.revisionStatus(r);
            return '<div class="backlog-item">' +
                '<div class="info"><span>' + r.topic + '</span>' +
                '<span class="tag">' + r.days + '-Day</span>' +
                '<span class="' + st.cls + '">' + st.label + '</span></div>' +
                '<div class="actions">' +
                '<button class="btn btn-gold btn-sm" onclick="toggleRevision(' + r.id + ')">' + (r.done ? '↩ Undo' : '✅ Done') + '</button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteRevision(' + r.id + ')">✕</button>' +
                '</div></div>';
        }).join('');
    },

    renderMocks() {
        const tbody = document.getElementById('mockBody');
        const tests = [...GateOS.data.mockTests].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        if (tests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty">No tests logged yet.</td></tr>';
        } else {
            tbody.innerHTML = tests.map(t => {
                const pct = t.max > 0 ? Math.round((t.score / t.max) * 100) : 0;
                return '<tr><td>' + (t.date || '—') + '</td><td>' + t.name + '</td><td>' + t.score + '</td><td>' + t.max + '</td><td>' + pct + '%</td>' +
                    '<td><button style="background:none;border:none;color:#c3ccd8;cursor:pointer;" onclick="deleteMock(' + t.id + ')">✕</button></td></tr>';
            }).join('');
        }

        if (GateOS.data.mockTests.length === 0) {
            document.getElementById('mockAvg').textContent = '—';
            document.getElementById('mockBest').textContent = '—';
            document.getElementById('mockTrend').textContent = '—';
            return;
        }

        const pcts = GateOS.data.mockTests.map(t => (t.max > 0 ? (t.score / t.max) * 100 : 0));
        document.getElementById('mockAvg').textContent = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) + '%';
        document.getElementById('mockBest').textContent = Math.round(Math.max(...pcts)) + '%';

        const chronological = [...GateOS.data.mockTests].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        const n = chronological.length;
        if (n >= 2) {
            const half = Math.max(1, Math.floor(n / 2));
            const firstHalf = chronological.slice(0, half).map(t => (t.max > 0 ? (t.score / t.max) * 100 : 0));
            const secondHalf = chronological.slice(half).map(t => (t.max > 0 ? (t.score / t.max) * 100 : 0));
            const diff = Math.round(secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length -
                firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length);
            document.getElementById('mockTrend').textContent = (diff >= 0 ? '↑ +' : '↓ ') + diff + '%';
        } else {
            document.getElementById('mockTrend').textContent = 'Log 2+ tests';
        }
    },

    renderHabits() {
        const t = GateOS.Dates.todayISO();
        const log = GateOS.data.habitLog[t] || {};
        document.getElementById('habitGrid').innerHTML = GateOS.data.habits.map(h =>
            '<div class="habit-row"><span>' + h.name + '</span>' +
            '<input type="checkbox" ' + (log[h.id] ? 'checked' : '') + ' onchange="toggleHabit(' + h.id + ')" /></div>'
        ).join('');

        let cells = '';
        for (let i = 13; i >= 0; i--) {
            const day = GateOS.Dates.addDaysISO(t, -i);
            const dlog = GateOS.data.habitLog[day] || {};
            const doneCount = Object.values(dlog).filter(Boolean).length;
            const total = GateOS.data.habits.length || 1;
            const sessionBonus = GateOS.Sessions.sessionsForDate(day).length > 0 ? 1 : 0;
            const ratio = (doneCount + sessionBonus) / (total + 1);
            let lvl = 0;
            if (ratio > 0 && ratio <= 0.33) lvl = 1;
            else if (ratio > 0.33 && ratio <= 0.66) lvl = 2;
            else if (ratio > 0.66) lvl = 3;
            cells += '<div class="heat-cell" data-lvl="' + lvl + '" title="' + day + ': ' + doneCount + '/' + GateOS.data.habits.length + '"></div>';
        }
        document.getElementById('habitHeatmap').innerHTML = cells;
    },

    renderBacklog() {
        const container = document.getElementById('backlogList');
        if (GateOS.data.backlogs.length === 0) {
            container.innerHTML = '<div class="empty">No backlogs! 🎉</div>';
            return;
        }
        container.innerHTML = GateOS.data.backlogs.map(b =>
            '<div class="backlog-item"><div class="info"><span>' + b.topic + '</span>' +
            '<span class="tag">' + b.subject + '</span>' +
            (b.done ? '<span class="status-done">✅ Done</span>' : '<span class="status-overdue">⏳ Pending</span>') +
            '</div><div class="actions">' +
            '<button class="btn btn-gold btn-sm" onclick="toggleBacklog(' + b.id + ')">' + (b.done ? '↩ Undo' : '✅ Done') + '</button>' +
            '<button class="btn btn-danger btn-sm" onclick="deleteBacklog(' + b.id + ')">✕</button>' +
            '</div></div>'
        ).join('');
    },

    renderToday() {
        const t = GateOS.Dates.todayISO();
        const log = GateOS.data.taskLog[t] || {};
        document.getElementById('todayList').innerHTML = GateOS.data.taskTemplates.map(tpl =>
            '<li><input type="checkbox" ' + (log[tpl.id] ? 'checked' : '') + ' onchange="toggleTodayTask(' + tpl.id + ')" />' +
            '<span class="' + (log[tpl.id] ? 'done' : '') + '">' + tpl.text + '</span>' +
            '<button class="rm" onclick="deleteTodayTask(' + tpl.id + ')">✕</button></li>'
        ).join('');
    },

    renderPlan() {
        const t = GateOS.Dates.todayISO();
        const plan = GateOS.data.planLog[t];
        if (!plan) return;

        const P = GateOS.Planner;
        document.getElementById('dayTypeBadge').textContent = P.isCollegeDay(t) ? 'College Day' : 'Study Day';

        const mission = P.getMissionSummary(t);
        const overdueEl = document.getElementById('missionOverdue');
        if (mission.overdueCount > 0) {
            overdueEl.style.display = 'block';
            overdueEl.innerHTML = '⚠️ <strong>' + mission.overdueCount + ' overdue lecture' +
                (mission.overdueCount > 1 ? 's' : '') + '</strong> carried from previous days.';
        } else {
            overdueEl.style.display = 'none';
        }

        const list = document.getElementById('planList');
        if (!plan.items.length) {
            list.innerHTML = '<li style="border:none;" class="empty">🎉 All caught up — nothing scheduled. Great work!</li>';
        } else {
            list.innerHTML = plan.items.map(it => {
                const done = P.isPlanItemDone(it);
                const carryBadge = it.carried
                    ? '<span style="font-size:0.65rem;background:#c8963e22;color:#c8963e;padding:2px 10px;border-radius:40px;">↺ carried</span>'
                    : '';
                const overdueBadge = it.overdue && !done
                    ? '<span style="font-size:0.65rem;background:#d45a5a22;color:#d45a5a;padding:2px 10px;border-radius:40px;">⏳ overdue</span>'
                    : '';
                return '<li><input type="checkbox" ' + (done ? 'checked' : '') + ' onchange="togglePlanItem(' + it.id + ')" />' +
                    '<span style="flex:1;" class="' + (done ? 'done' : '') + '">' + it.label + '</span>' +
                    '<span style="font-size:0.7rem;background:#eef2f7;padding:2px 10px;border-radius:40px;color:#4a5f7a;">' + it.minutes + 'm</span>' +
                    carryBadge + overdueBadge + '</li>';
            }).join('');
        }

        const totalMinutes = plan.items.reduce((s, it) => s + it.minutes, 0);
        const doneMinutes = plan.items.filter(it => P.isPlanItemDone(it)).reduce((s, it) => s + it.minutes, 0);
        const pct = totalMinutes > 0 ? Math.round((doneMinutes / totalMinutes) * 100) : 0;
        document.getElementById('planProgressFill').style.width = pct + '%';
        document.getElementById('planSummary').textContent =
            (P.isCollegeDay(t) ? 'College day — ' : 'Full study day — ') +
            'Today\'s Mission: ' + P.formatMinutes(totalMinutes) + ' across ' + plan.items.length +
            (plan.items.length === 1 ? ' task' : ' tasks') + ' (budget ' + P.formatMinutes(plan.budget) + ').';
    },

    renderSession() {
        const select = document.getElementById('sessionSubject');
        if (select) {
            select.innerHTML = GateOS.data.subjects.map(s => {
                const cur = GateOS.LectureEngine.getCurrentLecture(s);
                const label = s.name + ' (Lec ' + cur + '/' + s.total + ')';
                return '<option value="' + s.id + '">' + label + '</option>';
            }).join('');
        }

        const active = GateOS.Sessions.getActive();
        const timerEl = document.getElementById('sessionTimer');
        const statusEl = document.getElementById('sessionStatus');
        const startBtn = document.getElementById('sessionStartBtn');
        const pauseBtn = document.getElementById('sessionPauseBtn');
        const finishBtn = document.getElementById('sessionFinishBtn');

        if (!active) {
            if (timerEl) timerEl.textContent = '00:00:00';
            if (statusEl) statusEl.textContent = 'No active session';
            if (startBtn) startBtn.disabled = false;
            if (pauseBtn) { pauseBtn.disabled = true; pauseBtn.textContent = 'Pause'; }
            if (finishBtn) finishBtn.disabled = true;
            GateOS.Sessions.stopTimer();
            return;
        }

        if (timerEl) timerEl.textContent = GateOS.Sessions.formatElapsed(GateOS.Sessions.elapsedMs());
        if (statusEl) {
            statusEl.textContent = active.subjectName + ' · Lecture ' + active.lectureNumber + ' · ' +
                (active.status === 'paused' ? 'Paused' : 'Running');
        }
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) {
            pauseBtn.disabled = false;
            pauseBtn.textContent = active.status === 'paused' ? 'Resume' : 'Pause';
        }
        if (finishBtn) finishBtn.disabled = false;

        if (active.status === 'active' && !GateOS.Sessions.timerInterval) {
            GateOS.Sessions.startTimer();
        }
    },

    renderAnalytics() {
        GateOS.Analytics.renderActivityChart();
        GateOS.Analytics.renderPaceETA('dsaVideos', 'dsaDone', GateOS.data.dsaVideos.length, 'dsaPace', 'dsaEta', 'dsaEtaMini');
        GateOS.Analytics.renderPaceETA('codingProblems', 'codingDone', GateOS.data.codingProblems.length, 'codingPace', 'codingEta', 'codingEtaMini');
        GateOS.Analytics.renderHoursPanel();
    },
};
