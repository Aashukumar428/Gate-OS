/* GateOS — data layer & persistence */
window.GateOS = window.GateOS || {};

GateOS.STORAGE_KEY = 'gate2027_data_v3';

GateOS.freshData = function freshData() {
    const mkSubject = (id, name, total, weight) => ({
        id,
        name,
        total,
        weight,
        done: 0,
        currentLecture: 1,
        timeSpentMinutes: 0,
        notesCompleted: 0,
        pyqsCompleted: 0,
        confidence: 5,
        history: []
    });

    return {
        examDate: '2027-02-01',
        subjects: [
            mkSubject(1, 'DBMS', 30, 8),
            mkSubject(2, 'OS', 28, 8),
            mkSubject(3, 'Algorithms', 30, 9),
            mkSubject(4, 'CN', 24, 6),
            mkSubject(5, 'COA', 26, 6),
            mkSubject(6, 'TOC', 20, 7),
            mkSubject(7, 'Compiler', 18, 4),
        ],
        dsaVideos: [
            { id: 1, title: 'Arrays — Basics', difficulty: 'Easy', done: false },
            { id: 2, title: 'Arrays — Two Pointer', difficulty: 'Medium', done: false },
            { id: 3, title: 'Sorting — Merge Sort', difficulty: 'Medium', done: false },
            { id: 4, title: 'Sorting — Quick Sort', difficulty: 'Medium', done: false },
            { id: 5, title: 'Binary Search', difficulty: 'Medium', done: false },
            { id: 6, title: 'Linked List — Reverse', difficulty: 'Medium', done: false },
            { id: 7, title: 'Linked List — Cycle', difficulty: 'Hard', done: false },
            { id: 8, title: 'Stack — Next Greater', difficulty: 'Medium', done: false },
            { id: 9, title: 'Queue — Sliding Window', difficulty: 'Hard', done: false },
            { id: 10, title: 'DP — Fibonacci & Memoization', difficulty: 'Medium', done: false },
        ],
        codingProblems: [
            { id: 1, title: 'Two Sum', platform: 'LeetCode', topic: 'Array', time: '', done: false },
            { id: 2, title: 'Valid Parentheses', platform: 'LeetCode', topic: 'Stack', time: '', done: false },
            { id: 3, title: 'Merge Two Sorted Lists', platform: 'LeetCode', topic: 'LL', time: '', done: false },
            { id: 4, title: 'Maximum Subarray', platform: 'LeetCode', topic: 'DP', time: '', done: false },
            { id: 5, title: 'Rotate Array', platform: 'GFG', topic: 'Array', time: '', done: false },
        ],
        habits: [
            { id: 1, name: '😴 Sleep (7+ hrs)' },
            { id: 2, name: '🏋️ Exercise' },
            { id: 3, name: '🧘 Meditation' },
            { id: 4, name: '💻 Coding (1 hr+)' },
            { id: 5, name: '📖 GATE Lecture' },
            { id: 6, name: '🔄 Revision' },
            { id: 7, name: '💧 Water (8+ glasses)' },
        ],
        taskTemplates: [
            { id: 1, text: 'DBMS — Lecture' },
            { id: 2, text: 'OS — Lecture' },
            { id: 3, text: 'Algorithms — Lecture' },
            { id: 4, text: 'DSA — Striver Video' },
            { id: 5, text: 'Coding — 1 Problem' },
            { id: 6, text: "Revision — Today's recap" },
        ],
        taskLog: {},
        habitLog: {},
        progressLog: {},
        planLog: {},
        overdueLectures: {},
        revisions: [],
        backlogs: [
            { id: 1, topic: 'DBMS — Normalization', subject: 'DBMS', done: false },
            { id: 2, topic: 'OS — Deadlock', subject: 'OS', done: false },
        ],
        mockTests: [],
        sessions: [],
        activeSession: null,
        weeklyGoal: '',
        nextId: 100,
    };
};

GateOS.data = null;

GateOS.migrateData = function migrateData(parsed) {
    const base = GateOS.freshData();
    for (const key in base) {
        if (!(key in parsed)) parsed[key] = base[key];
    }

    parsed.subjects = (parsed.subjects || []).map(GateOS.LectureEngine.migrateSubject);
    parsed.sessions = parsed.sessions || [];
    parsed.activeSession = parsed.activeSession || null;
    parsed.overdueLectures = parsed.overdueLectures || {};

    return parsed;
};

GateOS.loadData = async function loadData() {
    const keys = [GateOS.STORAGE_KEY, 'gate2027_data_v2'];

    for (const key of keys) {
        try {
            if (window.storage) {
                const res = await window.storage.get(key, false);
                if (res && res.value) {
                    return GateOS.migrateData(JSON.parse(res.value));
                }
            }
        } catch (e) { /* storage unavailable */ }

        try {
            const raw = localStorage.getItem(key);
            if (raw) return GateOS.migrateData(JSON.parse(raw));
        } catch (e) { /* invalid json */ }
    }

    return GateOS.freshData();
};

GateOS.saveData = async function saveData() {
    const payload = JSON.stringify(GateOS.data);
    try {
        if (window.storage) {
            await window.storage.set(GateOS.STORAGE_KEY, payload, false);
            return;
        }
    } catch (e) { /* fall through */ }
    try {
        localStorage.setItem(GateOS.STORAGE_KEY, payload);
    } catch (e) {
        console.warn('Save failed', e);
    }
};

GateOS.getNextId = function getNextId() {
    return ++GateOS.data.nextId;
};

GateOS.ensureTodayLogs = function ensureTodayLogs() {
    const t = GateOS.Dates.todayISO();
    if (!GateOS.data.taskLog[t]) GateOS.data.taskLog[t] = {};
    if (!GateOS.data.habitLog[t]) GateOS.data.habitLog[t] = {};
    GateOS.data.progressLog[t] = {
        dsaDone: GateOS.data.dsaVideos.filter(v => v.done).length,
        codingDone: GateOS.data.codingProblems.filter(p => p.done).length,
    };
    GateOS.Planner.buildTodayPlan();
};
