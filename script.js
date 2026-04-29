const STORAGE_KEY = "taskflow-pro-tanzim-utsho";

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const dueInput = document.getElementById("dueInput");
const searchInput = document.getElementById("searchInput");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const filterButtons = document.querySelectorAll(".filter-btn");
const lists = document.querySelectorAll(".task-list");
const emptyStateTemplate = document.getElementById("emptyStateTemplate");

const statusOrder = ["todo", "inprogress", "done"];
const priorityStyles = {
  High: "bg-rose-50 text-rose-700 ring-rose-200",
  Medium: "bg-sky-50 text-sky-700 ring-sky-200",
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

let activeFilter = "All";
let tasks = loadTasks();

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(savedTasks)) return savedTasks;
  } catch (error) {
    console.warn("Saved tasks could not be loaded.", error);
  }

  return [
    {
      id: crypto.randomUUID(),
      title: "Design premium homepage polish",
      priority: "High",
      due: new Date().toISOString().slice(0, 10),
      status: "todo",
      createdAt: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      title: "Prepare project content and assets",
      priority: "Medium",
      due: "",
      status: "inprogress",
      createdAt: Date.now() + 1,
    },
    {
      id: crypto.randomUUID(),
      title: "Launch board by Tanzim Ahmed Utsho",
      priority: "Low",
      due: "",
      status: "done",
      createdAt: Date.now() + 2,
    },
  ];
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTask(title, priority, due) {
  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    priority,
    due,
    status: "todo",
    createdAt: Date.now(),
  });

  saveAndRender();
}

function saveAndRender() {
  saveTasks();
  renderBoard();
}

function renderBoard() {
  lists.forEach((list) => {
    list.innerHTML = "";
  });

  const visibleTasks = getVisibleTasks();

  statusOrder.forEach((status) => {
    const list = document.getElementById(status);
    const columnTasks = visibleTasks.filter((task) => task.status === status);

    columnTasks.forEach((task) => {
      list.appendChild(buildTaskCard(task));
    });

    if (!columnTasks.length) {
      list.appendChild(emptyStateTemplate.content.firstElementChild.cloneNode(true));
    }
  });

  updateStats();
}

function getVisibleTasks() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  return tasks
    .filter((task) => activeFilter === "All" || task.priority === activeFilter)
    .filter((task) => task.title.toLowerCase().includes(searchTerm))
    .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) || b.createdAt - a.createdAt);
}

function buildTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task-card mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
  card.draggable = true;
  card.dataset.id = task.id;

  const dueText = formatDueDate(task.due);
  const dueClass = getDueClass(task);

  card.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="break-words text-base font-black leading-6 text-slate-900">${escapeHTML(task.title)}</h3>
        <div class="mt-3 flex flex-wrap gap-2">
          <span class="rounded-full px-2.5 py-1 text-xs font-black ring-1 ${priorityStyles[task.priority]}">${task.priority}</span>
          <span class="rounded-full px-2.5 py-1 text-xs font-black ring-1 ${dueClass}">${dueText}</span>
        </div>
      </div>
      <button class="delete-task rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" type="button" aria-label="Delete task">
        Delete
      </button>
    </div>
    <div class="mt-4 grid grid-cols-2 gap-2">
      <button class="move-task rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-900 hover:text-white" type="button" data-direction="-1">Back</button>
      <button class="move-task rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-teal-600 hover:text-white" type="button" data-direction="1">Next</button>
    </div>
  `;

  card.addEventListener("dragstart", () => {
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  return card;
}

function formatDueDate(due) {
  if (!due) return "No due date";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${due}T00:00:00`);
  const diffDays = Math.round((dueDate - today) / 86400000);

  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays === -1) return "Due yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;

  return dueDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getDueClass(task) {
  if (!task.due) return "bg-slate-50 text-slate-500 ring-slate-200";
  if (task.status === "done") return "bg-emerald-50 text-emerald-700 ring-emerald-200";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${task.due}T00:00:00`);

  if (dueDate < today) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (dueDate.getTime() === today.getTime()) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-slate-50 text-slate-600 ring-slate-200";
}

function updateStats() {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  document.getElementById("totalTasks").innerText = total;
  document.getElementById("doneTasks").innerText = done;
  document.getElementById("progressPercent").innerText = `${progress}%`;
  document.getElementById("progressBar").style.width = `${progress}%`;

  statusOrder.forEach((status) => {
    document.getElementById(`${status}-count`).innerText = tasks.filter((task) => task.status === status).length;
  });
}

function moveTask(taskId, direction) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  const currentIndex = statusOrder.indexOf(task.status);
  const nextIndex = Math.min(Math.max(currentIndex + direction, 0), statusOrder.length - 1);
  task.status = statusOrder[nextIndex];
  saveAndRender();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveAndRender();
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    return;
  }

  createTask(title, priorityInput.value, dueInput.value);
  taskForm.reset();
  priorityInput.value = "Medium";
  taskInput.focus();
});

document.addEventListener("click", (event) => {
  const taskCard = event.target.closest(".task-card");
  if (!taskCard) return;

  if (event.target.closest(".delete-task")) {
    deleteTask(taskCard.dataset.id);
  }

  const moveButton = event.target.closest(".move-task");
  if (moveButton) {
    moveTask(taskCard.dataset.id, Number(moveButton.dataset.direction));
  }
});

lists.forEach((list) => {
  list.addEventListener("dragover", (event) => {
    event.preventDefault();
    list.classList.add("drag-over");
  });

  list.addEventListener("dragleave", () => {
    list.classList.remove("drag-over");
  });

  list.addEventListener("drop", (event) => {
    event.preventDefault();
    list.classList.remove("drag-over");

    const draggingTask = document.querySelector(".dragging");
    if (!draggingTask) return;

    const task = tasks.find((item) => item.id === draggingTask.dataset.id);
    if (!task) return;

    task.status = list.dataset.status;
    saveAndRender();
  });
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      item.classList.toggle("bg-slate-950", item === button);
      item.classList.toggle("text-white", item === button);
      item.classList.toggle("bg-white", item !== button);
      item.classList.toggle("text-slate-600", item !== button);
    });
    renderBoard();
  });
});

searchInput.addEventListener("input", renderBoard);

clearDoneBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => task.status !== "done");
  saveAndRender();
});

renderBoard();
