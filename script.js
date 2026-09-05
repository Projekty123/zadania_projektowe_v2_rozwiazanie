window.app = window.app || {};

app.tasks = [];
app.currentSort = 'desc';
app.activeTaskId = null;

app.loadTasks = function () {
    try {
        const data = JSON.parse(localStorage.getItem('project_tasks'));
        app.tasks = Array.isArray(data) ? data : [];

        app.tasks.forEach(task => {
            task.uwagi ??= [];
            task.data_dodania ??= new Date(0).toISOString();
        });
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
            data_dodania: new Date().toISOString(),
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
            '<span class="badge badge-neutral whitespace-nowrap">Do zrobienia</span>',
        'w trakcie':
            '<span class="badge badge-info text-white whitespace-nowrap">W trakcie</span>',
        zrobione:
            '<span class="badge badge-success text-white whitespace-nowrap">Zrobione</span>'
    };

    return badges[status] || status;
}

function getFilteredAndSortedTasks() {
    const title = document
        .getElementById('filter-title')
        .value
        .toLowerCase();

    const person = document
        .getElementById('filter-person')
        .value
        .toLowerCase();

    const statuses = Array.from(
        document.querySelectorAll('.filter-status:checked')
    ).map(checkbox => checkbox.value);

    const priorities = Array.from(
        document.querySelectorAll('.filter-priority:checked')
    ).map(checkbox => checkbox.value);

    const filteredTasks = app.tasks.filter(task => {
        return (
            task.tytul.toLowerCase().includes(title) &&
            task.osoba.toLowerCase().includes(person) &&
            (statuses.length === 0 ||
                statuses.includes(task.status)) &&
            (priorities.length === 0 ||
                priorities.includes(task.priorytet))
        );
    });

    filteredTasks.sort((a, b) => {
        if (app.currentSort === 'name') {
            return a.tytul.localeCompare(b.tytul, 'pl');
        }

        const dateA = new Date(a.data_dodania);
        const dateB = new Date(b.data_dodania);

        return app.currentSort === 'asc'
            ? dateA - dateB
            : dateB - dateA;
    });

    return filteredTasks;
}

function updateSummary(tasks) {
    document.getElementById('stat-total').innerText =
        tasks.length;

    document.getElementById('stat-todo').innerText =
        tasks.filter(
            task => task.status === 'do zrobienia'
        ).length;

    document.getElementById('stat-in-progress').innerText =
        tasks.filter(
            task => task.status === 'w trakcie'
        ).length;

    document.getElementById('stat-done').innerText =
        tasks.filter(
            task => task.status === 'zrobione'
        ).length;

    document.getElementById('stat-overdue').innerText =
        tasks.filter(
            task => app.isOverdue(task)
        ).length;
}

function updateFilterCounter() {
    const title = document
        .getElementById('filter-title')
        .value
        .trim();

    const person = document
        .getElementById('filter-person')
        .value
        .trim();

    const statuses = document.querySelectorAll(
        '.filter-status:checked'
    ).length;

    const priorities = document.querySelectorAll(
        '.filter-priority:checked'
    ).length;

    let counter = 0;

    if (title) {
        counter++;
    }

    if (person) {
        counter++;
    }

    if (statuses) {
        counter++;
    }

    if (priorities) {
        counter++;
    }

    const filterCounter =
        document.getElementById('filter-counter');

    if (filterCounter) {
        filterCounter.innerText = counter;
        filterCounter.classList.toggle(
            'hidden',
            counter === 0
        );
    }
}

app.render = function () {
    const tbody =
        document.getElementById('tasks-table-body');

    const tasks = getFilteredAndSortedTasks();

    tbody.innerHTML = '';

    if (tasks.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 8;
        cell.className =
            'text-center py-6 text-gray-500';
        cell.innerText =
            'Brak zadań do wyświetlenia.';

        row.appendChild(cell);
        tbody.appendChild(row);

        updateSummary([]);

        return;
    }

    tasks.forEach(task => {
        const row = document.createElement('tr');

        const overdue = app.isOverdue(task);
        const notesCount =
            task.uwagi?.length || 0;

        if (overdue) {
            row.classList.add('bg-error/10');
        }

        const titleCell =
            document.createElement('td');

        const titleButton =
            document.createElement('button');

        titleButton.className =
            'font-semibold text-primary hover:underline text-left';

        titleButton.innerText = task.tytul;

        titleButton.addEventListener('click', () => {
            app.openDetailsModal(task.id);
        });

        titleCell.appendChild(titleButton);

        const personCell =
            document.createElement('td');

        personCell.innerText = task.osoba;

        const priorityCell =
            document.createElement('td');

        priorityCell.innerHTML =
            getPriorityBadge(task.priorytet);

        const statusCell =
            document.createElement('td');

        statusCell.innerHTML =
            getStatusBadge(task.status);

        const dateCell =
            document.createElement('td');

        dateCell.innerText = task.termin;

        const notesCell =
            document.createElement('td');

        const notesButton =
            document.createElement('button');

        notesButton.className =
            `badge ${
                notesCount > 0
                    ? 'badge-primary'
                    : 'badge-ghost'
            } cursor-pointer`;

        notesButton.innerText = notesCount;

        notesButton.addEventListener('click', () => {
            app.openDetailsModal(task.id);
        });

        notesCell.appendChild(notesButton);

        const overdueCell =
            document.createElement('td');

        if (overdue) {
            overdueCell.innerHTML =
                '<span class="badge badge-error text-white">Zaległe</span>';
        } else {
            overdueCell.className =
                'text-gray-400';

            overdueCell.innerText = '-';
        }

        const actionsCell =
            document.createElement('td');

        actionsCell.className =
            'text-right whitespace-nowrap';

        const actions =
            document.createElement('div');

        actions.className =
            'flex justify-end gap-2';

        const editButton =
            document.createElement('button');

        editButton.className =
            'btn btn-sm btn-outline btn-primary';

        editButton.innerText = 'Edytuj';

        editButton.addEventListener('click', () => {
            app.openTaskModal(task.id);
        });

        const deleteButton =
            document.createElement('button');

        deleteButton.className =
            'btn btn-sm btn-outline btn-error';

        deleteButton.innerText = 'Usuń';

        deleteButton.addEventListener('click', () => {
            app.deleteTask(task.id);
        });

        actions.append(
            editButton,
            deleteButton
        );

        actionsCell.appendChild(actions);

        row.append(
            titleCell,
            personCell,
            priorityCell,
            statusCell,
            dateCell,
            notesCell,
            overdueCell,
            actionsCell
        );

        tbody.appendChild(row);
    });

    updateSummary(tasks);
};

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
}

app.openTaskModal = function (taskId = null) {
    const modal =
        document.getElementById('modal-task');

    const form =
        document.getElementById('form-task');

    const title =
        document.getElementById('modal-task-title');

    const cloneButton =
        document.getElementById('btn-clone-task');

    form.reset();

    document.getElementById('task-id').value = '';

    if (!taskId) {
        title.innerText =
            'Dodaj nowe zadanie';

        if (cloneButton) {
            cloneButton.classList.add('hidden');
        }

        modal.showModal();

        return;
    }

    const task =
        app.getTaskById(taskId);

    if (!task) {
        return;
    }

    title.innerText =
        'Edytuj zadanie';

    if (cloneButton) {
        cloneButton.classList.remove('hidden');
    }

    document.getElementById('task-id').value =
        task.id;

    document.getElementById('task-title').value =
        task.tytul;

    document.getElementById('task-desc').value =
        task.opis || '';

    document.getElementById('task-priority').value =
        task.priorytet;

    document.getElementById('task-status').value =
        task.status;

    document.getElementById('task-due-date').value =
        task.termin;

    document.getElementById('task-person').value =
        task.osoba;

    modal.showModal();
};

app.cloneTask = function () {
    const taskId =
        Number(
            document.getElementById('task-id').value
        );

    const task =
        app.getTaskById(taskId);

    if (!task) {
        return;
    }

    const clone = {
        ...task,
        id: Date.now(),
        data_dodania: new Date().toISOString(),
        uwagi: []
    };

    app.tasks.push(clone);
    app.saveTasks();

    document.getElementById('task-id').value =
        clone.id;

    document.getElementById('modal-task-title').innerText =
        'Edytuj zadanie';

    app.render();
};

app.openDetailsModal = function (taskId) {
    app.activeTaskId = Number(taskId);

    const task =
        app.getTaskById(app.activeTaskId);

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
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 3;
        cell.className =
            'text-center text-gray-400';

        cell.innerText = 'Brak uwag';

        row.appendChild(cell);
        tbody.appendChild(row);

        return;
    }

    task.uwagi.forEach(note => {
        const row =
            document.createElement('tr');

        const textCell =
            document.createElement('td');

        textCell.className =
            'break-words';

        textCell.innerText =
            note.tresc;

        const dateCell =
            document.createElement('td');

        dateCell.className =
            'whitespace-nowrap text-xs text-gray-500';

        dateCell.innerText =
            note.dataUtworzenia;

        const actionsCell =
            document.createElement('td');

        actionsCell.className =
            'text-right whitespace-nowrap';

        const editButton =
            document.createElement('button');

        editButton.className =
            'btn btn-ghost btn-xs text-info';

        editButton.innerText = 'Edytuj';

        editButton.addEventListener('click', () => {
            app.editNote(note.id);
        });

        const deleteButton =
            document.createElement('button');

        deleteButton.className =
            'btn btn-ghost btn-xs text-error';

        deleteButton.innerText = 'Usuń';

        deleteButton.addEventListener('click', () => {
            app.deleteNote(note.id);
        });

        actionsCell.append(
            editButton,
            deleteButton
        );

        row.append(
            textCell,
            dateCell,
            actionsCell
        );

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

    task.uwagi =
        task.uwagi.filter(
            note => note.id !== Number(noteId)
        );

    app.saveTasks();
    app.renderNotes();
    app.render();
};

document.addEventListener(
    'DOMContentLoaded',
    () => {
        app.loadTasks();

        initFilterCollapse();

        app.render();

        document
            .getElementById('btn-add-task')
            .addEventListener(
                'click',
                () => app.openTaskModal()
            );

        document
            .getElementById('btn-clear-all')
            .addEventListener(
                'click',
                app.clearAllTasks
            );

        const cloneButton =
            document.getElementById(
                'btn-clone-task'
            );

        if (cloneButton) {
            cloneButton.addEventListener(
                'click',
                app.cloneTask
            );
        }

        document
            .getElementById('filter-title')
            .addEventListener(
                'input',
                () => {
                    updateFilterCounter();
                    app.render();
                }
            );

        document
            .getElementById('filter-person')
            .addEventListener(
                'input',
                () => {
                    updateFilterCounter();
                    app.render();
                }
            );

        document
            .querySelectorAll('.filter-status')
            .forEach(checkbox => {
                checkbox.addEventListener(
                    'change',
                    () => {
                        updateFilterCounter();
                        app.render();
                    }
                );
            });

        document
            .querySelectorAll('.filter-priority')
            .forEach(checkbox => {
                checkbox.addEventListener(
                    'change',
                    () => {
                        updateFilterCounter();
                        app.render();
                    }
                );
            });

        document
            .getElementById('sort-desc')
            .addEventListener(
                'click',
                () => {
                    app.currentSort = 'desc';
                    app.render();
                }
            );

        document
            .getElementById('sort-asc')
            .addEventListener(
                'click',
                () => {
                    app.currentSort = 'asc';
                    app.render();
                }
            );

        document
            .getElementById('sort-name')
            .addEventListener(
                'click',
                () => {
                    app.currentSort = 'name';
                    app.render();
                }
            );

        const showJsonButton =
            document.getElementById(
                'btn-show-json'
            );

        if (showJsonButton) {
            showJsonButton.addEventListener(
                'click',
                () => {
                    document.getElementById(
                        'json-output'
                    ).value =
                        JSON.stringify(
                            app.tasks,
                            null,
                            2
                        );

                    document.getElementById(
                        'modal-json'
                    ).showModal();
                }
            );
        }

        document
            .getElementById('form-task')
            .addEventListener(
                'submit',
                event => {
                    event.preventDefault();

                    const getValue = id =>
                        document
                            .getElementById(id)
                            .value
                            .trim();

                    const taskData = {
                        id: document
                            .getElementById('task-id')
                            .value,

                        tytul:
                            getValue('task-title'),

                        opis:
                            getValue('task-desc'),

                        priorytet:
                            document
                                .getElementById(
                                    'task-priority'
                                )
                                .value,

                        status:
                            document
                                .getElementById(
                                    'task-status'
                                )
                                .value,

                        termin:
                            document
                                .getElementById(
                                    'task-due-date'
                                )
                                .value,

                        osoba:
                            getValue('task-person')
                    };

                    if (
                        !taskData.tytul ||
                        !taskData.priorytet ||
                        !taskData.status ||
                        !taskData.termin ||
                        !taskData.osoba
                    ) {
                        alert(
                            'Uzupełnij wszystkie wymagane pola!'
                        );

                        return;
                    }

                    app.saveTaskData(taskData);

                    document
                        .getElementById(
                            'modal-task'
                        )
                        .close();

                    app.render();
                }
            );

        document
            .getElementById('form-note')
            .addEventListener(
                'submit',
                event => {
                    event.preventDefault();

                    const task =
                        app.getTaskById(
                            app.activeTaskId
                        );

                    if (!task) {
                        return;
                    }

                    task.uwagi ??= [];

                    const noteId =
                        document.getElementById(
                            'note-id'
                        ).value;

                    const text =
                        document
                            .getElementById(
                                'note-text'
                            )
                            .value
                            .trim();

                    if (!text) {
                        return;
                    }

                    if (noteId) {
                        const note =
                            task.uwagi.find(
                                note =>
                                    note.id ===
                                    Number(noteId)
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
                                `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`
                        });
                    }

                    app.saveTasks();
                    app.resetNoteForm();
                    app.renderNotes();
                    app.render();
                }
            );

        document
            .getElementById(
                'btn-cancel-note'
            )
            .addEventListener(
                'click',
                app.resetNoteForm
            );
    }
);
