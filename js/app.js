/* GateOS — app handlers & init */
window.GateOS = window.GateOS || {};

function saveAndRender() {
    GateOS.saveData();
    GateOS.Render.renderAll();
}

function updateWeight(id, val) {
    const sub = GateOS.data.subjects.find(s => s.id === id);
    if (sub) {
        sub.weight = Math.max(1, Math.min(10, parseInt(val, 10) || 1));
        GateOS.saveData();
        GateOS.Render.renderStats();
    }
}

function completeLecture(id) {
    const sub = GateOS.data.subjects.find(s => s.id === id);
    if (!sub) return;
    const notesEl = document.getElementById('notes_' + id);
    const pyqsEl = document.getElementById('pyqs_' + id);
    const confEl = document.getElementById('conf_' + id);
    GateOS.LectureEngine.completeLecture(sub, {
        notesDone: notesEl ? notesEl.checked : false,
        pyqsDone: pyqsEl ? pyqsEl.checked : false,
        confidence: confEl ? confEl.value : sub.confidence,
        timeMinutes: 0,
    });
    saveAndRender();
}

function incrementSubject(id) {
    completeLecture(id);
}

function deleteSubject(id) {
    if (confirm('Delete this subject?')) {
        GateOS.data.subjects = GateOS.data.subjects.filter(s => s.id !== id);
        saveAndRender();
    }
}

function addSubject() {
    const name = document.getElementById('newSubjectInput').value.trim();
    const total = parseInt(document.getElementById('newSubjectTotal').value, 10);
    if (!name || !total || total < 1) return alert('Enter subject name and total lectures');
    GateOS.data.subjects.push({
        id: GateOS.getNextId(),
        name,
        total,
        done: 0,
        weight: 5,
        currentLecture: 1,
        timeSpentMinutes: 0,
        notesCompleted: 0,
        pyqsCompleted: 0,
        confidence: 5,
        history: [],
    });
    document.getElementById('newSubjectInput').value = '';
    document.getElementById('newSubjectTotal').value = '';
    saveAndRender();
}

function toggleDSA(id) {
    const v = GateOS.data.dsaVideos.find(x => x.id === id);
    if (!v) return;
    v.done = !v.done;
    if (v.done) GateOS.scheduleRevision(v.title, GateOS.Dates.todayISO(), [1, 7]);
    GateOS.ensureTodayLogs();
    saveAndRender();
}

function deleteDsa(id) {
    GateOS.data.dsaVideos = GateOS.data.dsaVideos.filter(x => x.id !== id);
    saveAndRender();
}

function addDsaVideo() {
    const title = document.getElementById('newDsaInput').value.trim();
    const difficulty = document.getElementById('newDsaDifficulty').value;
    if (!title) return alert('Enter video title');
    GateOS.data.dsaVideos.push({ id: GateOS.getNextId(), title, difficulty, done: false });
    document.getElementById('newDsaInput').value = '';
    saveAndRender();
}

function toggleCoding(id) {
    const p = GateOS.data.codingProblems.find(x => x.id === id);
    if (!p) return;
    p.done = !p.done;
    GateOS.ensureTodayLogs();
    saveAndRender();
}

function deleteCoding(id) {
    GateOS.data.codingProblems = GateOS.data.codingProblems.filter(x => x.id !== id);
    saveAndRender();
}

function updateCodingTime(id, time) {
    const p = GateOS.data.codingProblems.find(x => x.id === id);
    if (p) { p.time = time; GateOS.saveData(); }
}

function addCodingProblem() {
    const title = document.getElementById('newCodingInput').value.trim();
    const platform = document.getElementById('newCodingPlatform').value;
    const topic = document.getElementById('newCodingTopic').value.trim();
    if (!title) return alert('Enter problem name');
    GateOS.data.codingProblems.push({ id: GateOS.getNextId(), title, platform, topic, time: '', done: false });
    document.getElementById('newCodingInput').value = '';
    document.getElementById('newCodingTopic').value = '';
    saveAndRender();
}

function toggleRevision(id) {
    const r = GateOS.data.revisions.find(x => x.id === id);
    if (r) { r.done = !r.done; GateOS.ensureTodayLogs(); saveAndRender(); }
}

function deleteRevision(id) {
    GateOS.data.revisions = GateOS.data.revisions.filter(r => r.id !== id);
    saveAndRender();
}

function addRevision() {
    const topic = document.getElementById('newRevInput').value.trim();
    const days = parseInt(document.getElementById('newRevDays').value, 10);
    if (!topic) return alert('Enter topic to revise');
    GateOS.scheduleRevision(topic, GateOS.Dates.todayISO(), [days]);
    document.getElementById('newRevInput').value = '';
    saveAndRender();
}

function deleteMock(id) {
    GateOS.data.mockTests = GateOS.data.mockTests.filter(t => t.id !== id);
    saveAndRender();
}

function addMockTest() {
    const name = document.getElementById('newMockName').value.trim();
    const date = document.getElementById('newMockDate').value || GateOS.Dates.todayISO();
    const score = parseFloat(document.getElementById('newMockScore').value);
    const max = parseFloat(document.getElementById('newMockMax').value);
    if (!name || isNaN(score) || isNaN(max) || max <= 0) return alert('Fill in test name, score and max score');
    GateOS.data.mockTests.push({ id: GateOS.getNextId(), name, date, score, max });
    document.getElementById('newMockName').value = '';
    document.getElementById('newMockScore').value = '';
    saveAndRender();
}

function toggleHabit(id) {
    const t = GateOS.Dates.todayISO();
    if (!GateOS.data.habitLog[t]) GateOS.data.habitLog[t] = {};
    GateOS.data.habitLog[t][id] = !GateOS.data.habitLog[t][id];
    saveAndRender();
}

function addHabit() {
    const name = document.getElementById('newHabitInput').value.trim();
    if (!name) return alert('Enter habit name');
    GateOS.data.habits.push({ id: GateOS.getNextId(), name });
    document.getElementById('newHabitInput').value = '';
    saveAndRender();
}

function toggleBacklog(id) {
    const b = GateOS.data.backlogs.find(x => x.id === id);
    if (b) { b.done = !b.done; saveAndRender(); }
}

function deleteBacklog(id) {
    GateOS.data.backlogs = GateOS.data.backlogs.filter(b => b.id !== id);
    saveAndRender();
}

function addBacklog() {
    const topic = document.getElementById('newBacklogInput').value.trim();
    const subject = document.getElementById('newBacklogSubject').value;
    if (!topic) return alert('Enter backlog topic');
    GateOS.data.backlogs.push({ id: GateOS.getNextId(), topic, subject, done: false });
    document.getElementById('newBacklogInput').value = '';
    saveAndRender();
}

function toggleTodayTask(id) {
    const t = GateOS.Dates.todayISO();
    if (!GateOS.data.taskLog[t]) GateOS.data.taskLog[t] = {};
    GateOS.data.taskLog[t][id] = !GateOS.data.taskLog[t][id];
    saveAndRender();
}

function deleteTodayTask(id) {
    GateOS.data.taskTemplates = GateOS.data.taskTemplates.filter(x => x.id !== id);
    saveAndRender();
}

function addTodayTask() {
    const text = document.getElementById('newTaskInput').value.trim();
    if (!text) return alert('Enter a task');
    GateOS.data.taskTemplates.push({ id: GateOS.getNextId(), text });
    document.getElementById('newTaskInput').value = '';
    saveAndRender();
}

function updateWeeklyGoal(val) {
    GateOS.data.weeklyGoal = val;
    GateOS.saveData();
}

function updateExamDate(val) {
    if (!val) return;
    GateOS.data.examDate = val;
    saveAndRender();
}

function togglePlanItem(id) {
    GateOS.Planner.togglePlanItem(id);
}

function startSession() {
    const select = document.getElementById('sessionSubject');
    const subjectId = parseInt(select.value, 10);
    GateOS.Sessions.start(subjectId);
}

function pauseSession() {
    const active = GateOS.Sessions.getActive();
    if (active && active.status === 'paused') {
        GateOS.Sessions.resume();
    } else {
        GateOS.Sessions.pause();
    }
}

function resumeSession() {
    GateOS.Sessions.resume();
}

function finishSession() {
    GateOS.Sessions.finish();
}

function exportData() {
    const blob = new Blob([JSON.stringify(GateOS.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gate2027-backup-' + GateOS.Dates.todayISO() + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importData(evt) {
    const file = evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            GateOS.data = GateOS.migrateData(JSON.parse(e.target.result));
            await GateOS.saveData();
            GateOS.Render.renderAll();
            alert('Backup restored successfully.');
        } catch (err) {
            alert('Could not read that file — is it a valid backup JSON?');
        }
    };
    reader.readAsText(file);
    evt.target.value = '';
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('tab-' + this.dataset.tab).classList.add('active');
    });
});

(async function init() {
    GateOS.data = await GateOS.loadData();
    GateOS.ensureTodayLogs();
    await GateOS.saveData();
    GateOS.Render.renderAll();
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
})();

setInterval(() => GateOS.saveData(), 15000);
