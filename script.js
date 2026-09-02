
window.app = window.app || {};

app.tasks = [];
app.currentSort = 'desc';
app.activeTaskId = null;

// Wczytanie zadań zapisanych wcześniej w localStorage
app.loadTasks = function () {
    try {
        const data = JSON.parse(localStorage.getItem('project_tasks'));
        app.tasks = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Nie udało się wczytać zadań:', error);
        app.tasks = [];
    }
};

app.saveTasks = function () {
    localStorage.setItem('project_tasks', JSON.stringify(app.tasks));
};

app.getTaskById = function (id) {
    return app.tasks.find(task => task.id === Number(id));
};

// Sprawdza, czy zadanie jest po terminie i nie zostało jeszcze wykonane
app.isOverdue = function (task) {
    if (task.status === 'zrobione') {
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return new Date(task.termin) < today;
};

app.saveTaskData = function (taskData) {
    if (taskData.id) {
        const index = app.tasks.findIndex(
            task => task.id === Number(taskData.id)
        );

        if (index !== -1) {
            app.tasks[index] = {
                ...app.tasks[index],
                ...taskData,
                id: Number(taskData.id)
            };
        }
    } else {
        app.tasks.push({
            ...taskData,
            id: Date.now(),
            uwagi: []
        });
    }

    app.saveTasks();
};

app.deleteTask = function (id) {
    if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) {
        return;
    }

    app.tasks = app.tasks.filter(
        task => task.id !== Number(id)
    );

    app.saveTasks();
    app.render();
};

app.clearAllTasks = function () {
    const message =
        'Czy na pewno chcesz usunąć wszystkie zadania? Operacji nie można cofnąć.';

    if (!confirm(message)) {
        return;
    }

    app.tasks = [];
    app.saveTasks();
    app.render();
};


// Badge pozwalają szybko rozpoznać priorytet zadania
function getPriorityBadge(priority) {
    const badges = {
        niski: '<span class="badge badge-ghost">Niski</span>',
        sredni: '<span class="badge badge-warning">Średni</span>',
        wysoki: '<span class="badge badge-error text-white">Wysoki</span>'
    };

    return badges[priority] || priority;
}

function getStatusBadge(status) {
    const badges = {
        'do zrobienia':
            '<span class="badge badge-neutral">Do zrobienia</span>',
        'w trakcie':
            '<span class="badge badge-info text-white">W trakcie</span>',
        zrobione:
            '<span class="badge badge-success text-white">Zrobione</span>'
    };

    return badges[status] || status;
};


// Pobiera zadania zgodne z filtrami i ustawia wybraną kolejność
function getFilteredAndSortedTasks() {
    const title = document
        .getElementById('filter-title')
        .value
        .toLowerCase();

    const person = document
        .getElementById('filter-person')
        .value
        .toLowerCase();

    const status =
        document.getElementById('filter-status').value;

    const priority =
        document.getElementById('filter-priority').value;

    const filteredTasks = app.tasks.filter(task => {
        return (
            task.tytul.toLowerCase().includes(title) &&
            task.osoba.toLowerCase().includes(person) &&
            (!status || task.status === status) &&
            (!priority || task.priorytet === priority)
        );
    });

    filteredTasks.sort((a, b) => {
        if (app.currentSort === 'name') {
            return a.tytul.localeCompare(b.tytul);
        }

        const dateA = new Date(a.termin);
        const dateB = new Date(b.termin);

        return app.currentSort === 'asc'
            ? dateA - dateB
            : dateB - dateA;
    });

    return filteredTasks;
};


function updateSummary(tasks) {
    document.getElementById('stat-total').innerText =
        tasks.length;

    document.getElementById('stat-todo').innerText =
        tasks.filter(task => task.status === 'do zrobienia').length;

    document.getElementById('stat-in-progress').innerText =
        tasks.filter(task => task.status === 'w trakcie').length;

    document.getElementById('stat-done').innerText =
        tasks.filter(task => task.status === 'zrobione').length;

    document.getElementById('stat-overdue').innerText =
        tasks.filter(task => app.isOverdue(task)).length;
};


// Renderowanie głównej tabeli
app.render = function () {
    const tbody =
        document.getElementById('tasks-table-body');

    const tasks = getFilteredAndSortedTasks();

    tbody.innerHTML = '';

    if (tasks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-6 text-gray-500">
                    Brak zadań do wyświetlenia.
                </td>
            </tr>
        `;

        updateSummary([]);
        return;
    }

    tasks.forEach(task => {
        const row = document.createElement('tr');
        const overdue = app.isOverdue(task);
        const notesCount = task.uwagi?.length || 0;

        if (overdue) {
            row.classList.add('bg-error/10');
        }

        row.innerHTML = `
            <td>
                <button
                    class="font-semibold text-primary hover:underline text-left"
                    onclick="app.openDetailsModal(${task.id})"
                >
                    ${task.tytul}
                </button>
            </td>

            <td>${task.osoba}</td>

            <td>${getPriorityBadge(task.priorytet)}</td>

            <td>${getStatusBadge(task.status)}</td>

            <td>${task.termin}</td>

            <td>
                <span
                    class="badge ${
                        notesCount > 0
                            ? 'badge-primary'
                            : 'badge-ghost'
                    } cursor-pointer"
                    onclick="app.openDetailsModal(${task.id})"
                >
                    ${notesCount}
                </span>
            </td>

            <td>
                ${
                    overdue
                        ? '<span class="badge badge-error text-white">Zaległe</span>'
                        : '<span class="text-gray-400">-</span>'
                }
            </td>

            <td class="text-right whitespace-nowrap">
                <div class="flex justify-end gap-2">
                <button class="btn btn-sm btn-outline btn-primary" onclick="app.openTaskModal(${task.id})">
                    Edytuj
                </button>

                <button class="btn btn-sm btn-outline btn-error" onclick="app.deleteTask(${task.id})">
                    Usuń
                </button>
            </div>
            </td>
        `;

        tbody.appendChild(row);
    });

    updateSummary(tasks);
};


// Zapamiętuje, czy panel filtrów jest zwinięty
function initFilterCollapse() {
    const toggle =
        document.getElementById('filter-toggle');

    const savedState =
        localStorage.getItem('filter_panel_open');

    if (savedState !== null) {
        toggle.checked = JSON.parse(savedState);
    }

    toggle.addEventListener('change', () => {
        localStorage.setItem(
            'filter_panel_open',
            JSON.stringify(toggle.checked)
        );
    });
};


// Ten sam modal służy do dodawania i edycji zadania
app.openTaskModal = function (taskId = null) {
    const modal =
        document.getElementById('modal-task');

    const form =
        document.getElementById('form-task');

    const title =
        document.getElementById('modal-task-title');

    form.reset();

    document.getElementById('task-id').value = '';

    if (!taskId) {
        title.innerText = 'Dodaj nowe zadanie';
        modal.showModal();
        return;
    }

    const task = app.getTaskById(taskId);

    if (!task) {
        return;
    }

    title.innerText = 'Edytuj zadanie';

    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.tytul;
    document.getElementById('task-desc').value = task.opis || '';
    document.getElementById('task-priority').value = task.priorytet;
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-due-date').value = task.termin;
    document.getElementById('task-person').value = task.osoba;

    modal.showModal();
};


document.getElementById('form-task').addEventListener('submit', event => {
    event.preventDefault();

    const getValue = id =>
        document.getElementById(id).value.trim();

    const taskData = {
        id: document.getElementById('task-id').value,
        tytul: getValue('task-title'),
        opis: getValue('task-desc'),
        priorytet: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        termin: document.getElementById('task-due-date').value,
        osoba: getValue('task-person')
    };

    if (
        !taskData.tytul ||
        !taskData.priorytet ||
        !taskData.status ||
        !taskData.termin ||
        !taskData.osoba
    ) {
        alert('Uzupełnij wszystkie wymagane pola!');
        return;
    }

    app.saveTaskData(taskData);

    document.getElementById('modal-task').close();
    app.render();
});


app.openDetailsModal = function (taskId) {
    app.activeTaskId = Number(taskId);

    const task = app.getTaskById(app.activeTaskId);

    if (!task) {
        return;
    }

    task.uwagi ??= [];

    document.getElementById('detail-title').innerText =
        task.tytul;

    document.getElementById('detail-meta').innerText =
        `Osoba: ${task.osoba} | Termin: ${task.termin}`;

    document.getElementById('detail-desc').innerText =
        task.opis || 'Brak opisu.';

    app.resetNoteForm();
    app.renderNotes();

    document.getElementById('modal-details').showModal();
};


app.renderNotes = function () {
    const task =
        app.getTaskById(app.activeTaskId);

    const tbody =
        document.getElementById('notes-table-body');

    tbody.innerHTML = '';

    if (!task?.uwagi?.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-gray-400">
                    Brak uwag
                </td>
            </tr>
        `;

        return;
    }

    task.uwagi.forEach(note => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td class="break-words">
                ${note.tresc}
            </td>

            <td class="whitespace-nowrap text-xs text-gray-500">
                ${note.dataUtworzenia}
            </td>

            <td class="text-right whitespace-nowrap">
                <button
                    class="btn btn-ghost btn-xs text-info"
                    onclick="app.editNote(${note.id})"
                    title="Edytuj uwagę"
                >
                    Edytuj
                </button>

                <button
                    class="btn btn-ghost btn-xs text-error"
                    onclick="app.deleteNote(${note.id})"
                    title="Usuń uwagę"
                >
                    Usuń
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
};


app.resetNoteForm = function () {
    document.getElementById('form-note').reset();
    document.getElementById('note-id').value = '';

    document.getElementById('btn-save-note').innerText =
        'Dodaj uwagę';

    document
        .getElementById('btn-cancel-note')
        .classList.add('hidden');
};


document.getElementById('form-note').addEventListener('submit', event => {
    event.preventDefault();

    const task =
        app.getTaskById(app.activeTaskId);

    if (!task) {
        return;
    }

    task.uwagi ??= [];

    const noteId =
        document.getElementById('note-id').value;

    const text =
        document
            .getElementById('note-text')
            .value
            .trim();

    if (!text) {
        return;
    }

    if (noteId) {
        const note = task.uwagi.find(
            note => note.id === Number(noteId)
        );

        if (note) {
            note.tresc = text;
        }
    } else {
        const now = new Date();

        task.uwagi.push({
            id: Date.now(),
            tresc: text,
            dataUtworzenia:
                `${now.toISOString().split('T')[0]} ${now
                    .toTimeString()
                    .slice(0, 5)}`
        });
    }

    app.saveTasks();
    app.resetNoteForm();
    app.renderNotes();
    app.render();
});


app.editNote = function (noteId) {
    const task =
        app.getTaskById(app.activeTaskId);

    const note =
        task?.uwagi?.find(
            note => note.id === Number(noteId)
        );

    if (!note) {
        return;
    }

    document.getElementById('note-id').value =
        note.id;

    document.getElementById('note-text').value =
        note.tresc;

    document.getElementById('btn-save-note').innerText =
        'Zapisz';

    document
        .getElementById('btn-cancel-note')
        .classList.remove('hidden');
};


app.deleteNote = function (noteId) {
    const task =
        app.getTaskById(app.activeTaskId);

    if (!task) {
        return;
    }

    task.uwagi = task.uwagi.filter(
        note => note.id !== Number(noteId)
    );

    app.saveTasks();
    app.renderNotes();
    app.render();
};


document
    .getElementById('btn-cancel-note')
    .addEventListener('click', app.resetNoteForm);


// Uruchomienie aplikacji po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    app.loadTasks();
    initFilterCollapse();
    app.render();

    document
        .getElementById('btn-add-task')
        .addEventListener('click', () => app.openTaskModal());

    document
        .getElementById('btn-clear-all')
        .addEventListener('click', app.clearAllTasks);

    document
        .getElementById('filter-title')
        .addEventListener('input', app.render);

    document
        .getElementById('filter-person')
        .addEventListener('input', app.render);

    document
        .getElementById('filter-status')
        .addEventListener('change', app.render);

    document
        .getElementById('filter-priority')
        .addEventListener('change', app.render);

    document
        .getElementById('sort-desc')
        .addEventListener('click', () => {
            app.currentSort = 'desc';
            app.render();
        });

    document
        .getElementById('sort-asc')
        .addEventListener('click', () => {
            app.currentSort = 'asc';
            app.render();
        });

    document
        .getElementById('sort-name')
        .addEventListener('click', () => {
            app.currentSort = 'name';
            app.render();
        });
});
