const STORAGE_KEY = "taskflow-pro-tanzim-utsho";
const THEME_KEY = "taskflow-pro-theme";
const DUE_ALERTS_KEY = "taskflow-pro-due-alerts";

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const dueInput = document.getElementById("dueInput");
const tagInput = document.getElementById("tagInput");
const searchInput = document.getElementById("searchInput");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const themeToggle = document.getElementById("themeToggle");
const notificationToggle = document.getElementById("notificationToggle");
const filterButtons = document.querySelectorAll(".filter-btn");
const lists = document.querySelectorAll(".task-list");
const emptyStateTemplate = document.getElementById("emptyStateTemplate");

const statusOrder = ["todo", "inprogress", "done"];
const IN_PROGRESS_STATUS = "inprogress";
const priorityStyles = {
  High: "bg-rose-50 text-rose-700 ring-rose-200",
  Medium: "bg-sky-50 text-sky-700 ring-sky-200",
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

let activeFilter = "All";
let tasks = loadTasks();
let activeTheme = localStorage.getItem(THEME_KEY) || "light";
saveTasks();
applyTheme(activeTheme);

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(savedTasks)) {
      return savedTasks.map((task) => {
        const inProgressStartedAt =
          task.status === IN_PROGRESS_STATUS ? task.inProgressStartedAt || Date.now() : null;

        return {
          details: "",
          tags: [],
          ...task,
          tags: Array.isArray(task.tags) ? task.tags : [],
          inProgressStartedAt,
        };
      });
    }
  } catch (error) {
    console.warn("Saved tasks could not be loaded.", error);
  }

  return [
    {
      id: crypto.randomUUID(),
      title: "Design premium homepage polish",
      priority: "High",
      details: "Refine spacing, visual rhythm, and the final responsive pass.",
      tags: ["Design"],
      due: new Date().toISOString().slice(0, 10),
      status: "todo",
      inProgressStartedAt: null,
      createdAt: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      title: "Prepare project content and assets",
      priority: "Medium",
      details: "Collect screenshots, copy, and launch checklist notes.",
      tags: ["Assets"],
      due: "",
      status: "inprogress",
      inProgressStartedAt: Date.now(),
      createdAt: Date.now() + 1,
    },
    {
      id: crypto.randomUUID(),
      title: "Launch board by Tanzim Ahmed Utsho",
      priority: "Low",
      details: "Final review complete.",
      tags: ["Launch"],
      due: "",
      status: "done",
      inProgressStartedAt: null,
      createdAt: Date.now() + 2,
    },
  ];
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function applyTheme(theme) {
  activeTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = activeTheme;
  localStorage.setItem(THEME_KEY, activeTheme);

  const isDark = activeTheme === "dark";
  themeToggle.innerText = isDark ? "Light Mode" : "Dark Mode";
  themeToggle.setAttribute("aria-pressed", String(isDark));
}

function createTask(title, priority, due, tags) {
  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    priority,
    details: "",
    tags,
    due,
    status: "todo",
    inProgressStartedAt: null,
    createdAt: Date.now(),
  });

  saveAndRender();
}

function saveAndRender() {
  saveTasks();
  renderBoard();
  notifyDueTasks();
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
    .filter((task) => `${task.title} ${task.details || ""} ${(task.tags || []).join(" ")}`.toLowerCase().includes(searchTerm))
    .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) || b.createdAt - a.createdAt);
}

function buildTaskCard(task) {
  const card = document.createElement("article");
  card.className = `task-card mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${
    isDueAlertTask(task) ? "due-alert-card" : ""
  }`;
  card.draggable = true;
  card.dataset.id = task.id;

  const dueText = formatDueDate(task.due);
  const dueClass = getDueClass(task);
  const detailsHTML = task.details
    ? `<p class="mt-2 break-words text-sm leading-6 text-slate-500">${escapeHTML(task.details)}</p>`
    : "";
  const tagsHTML = (task.tags || [])
    .map(
      (tag) =>
        `<span class="custom-tag rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700 ring-1 ring-violet-200">${escapeHTML(tag)}</span>`,
    )
    .join("");
  const timerHTML =
    task.status === IN_PROGRESS_STATUS
      ? `<span class="progress-timer rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white" data-task-id="${task.id}">Time ${formatElapsedTime(getInProgressElapsed(task))}</span>`
      : "";

  card.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="break-words text-base font-black leading-6 text-slate-900">${escapeHTML(task.title)}</h3>
        ${detailsHTML}
        <div class="mt-3 flex flex-wrap gap-2">
          <span class="rounded-full px-2.5 py-1 text-xs font-black ring-1 ${priorityStyles[task.priority]}">${task.priority}</span>
          ${tagsHTML}
          <span class="rounded-full px-2.5 py-1 text-xs font-black ring-1 ${dueClass}">${dueText}</span>
          ${timerHTML}
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

  card.addEventListener("dragstart", (event) => {
    if (card.classList.contains("editing")) {
      event.preventDefault();
      return;
    }

    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  card.addEventListener("dblclick", (event) => {
    if (event.target.closest("button")) return;
    startEditingTask(task.id);
  });

  return card;
}

function startEditingTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  const card = Array.from(document.querySelectorAll(".task-card")).find((item) => item.dataset.id === taskId);
  if (!task || !card) return;

  card.classList.add("editing");
  card.draggable = false;
  card.innerHTML = `
    <form class="edit-task-form grid gap-3">
      <input
        class="edit-title h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
        type="text"
        maxlength="90"
        value="${escapeHTML(task.title)}"
        required
      />
      <textarea
        class="edit-details min-h-24 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
        maxlength="240"
      >${escapeHTML(task.details || "")}</textarea>
      <input
        class="edit-tags h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
        type="text"
        maxlength="120"
        value="${escapeHTML((task.tags || []).join(", "))}"
        placeholder="Tags: Bug, Design, Urgent"
      />
      <div class="grid grid-cols-2 gap-2">
        <button class="cancel-edit rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200" type="button">Cancel</button>
        <button class="rounded-xl bg-teal-600 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-950" type="submit">Save</button>
      </div>
    </form>
  `;

  const form = card.querySelector(".edit-task-form");
  const titleInput = card.querySelector(".edit-title");
  const detailsInput = card.querySelector(".edit-details");
  const tagsInput = card.querySelector(".edit-tags");

  titleInput.focus();
  titleInput.select();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      return;
    }

    updateTask(taskId, title, detailsInput.value.trim(), parseTags(tagsInput.value));
  });

  card.querySelector(".cancel-edit").addEventListener("click", renderBoard);
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

function getDueStatus(task) {
  if (!task.due || task.status === "done") return "none";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${task.due}T00:00:00`);

  if (dueDate < today) return "overdue";
  if (dueDate.getTime() === today.getTime()) return "today";
  return "upcoming";
}

function isDueAlertTask(task) {
  const dueStatus = getDueStatus(task);
  return dueStatus === "overdue" || dueStatus === "today";
}

function updateStats() {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  document.getElementById("totalTasks").innerText = total;
  document.getElementById("doneTasks").innerText = done;
  document.getElementById("progressPercent").innerText = `${progress}%`;
  document.getElementById("progressChart").style.setProperty("--progress", `${progress * 3.6}deg`);
  document.getElementById("progressBar").style.width = `${progress}%`;

  statusOrder.forEach((status) => {
    document.getElementById(`${status}-count`).innerText = tasks.filter((task) => task.status === status).length;
  });
}

function setTaskStatus(task, status) {
  if (task.status === status) return;

  task.status = status;
  task.inProgressStartedAt = status === IN_PROGRESS_STATUS ? Date.now() : null;
}

function moveTask(taskId, direction) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  const currentIndex = statusOrder.indexOf(task.status);
  const nextIndex = Math.min(Math.max(currentIndex + direction, 0), statusOrder.length - 1);
  setTaskStatus(task, statusOrder[nextIndex]);
  saveAndRender();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveAndRender();
}

function updateTask(taskId, title, details, tags) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.title = title;
  task.details = details;
  task.tags = tags;
  saveAndRender();
}

function parseTags(value) {
  const seenTags = new Set();

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seenTags.has(key)) return false;

      seenTags.add(key);
      return true;
    })
    .slice(0, 6);
}

function getInProgressElapsed(task) {
  if (task.status !== IN_PROGRESS_STATUS || !task.inProgressStartedAt) return 0;
  return Math.max(0, Date.now() - task.inProgressStartedAt);
}

function formatElapsedTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function updateProgressTimers() {
  document.querySelectorAll(".progress-timer").forEach((timer) => {
    const task = tasks.find((item) => item.id === timer.dataset.taskId);
    if (!task) return;

    timer.innerText = `Time ${formatElapsedTime(getInProgressElapsed(task))}`;
  });
}

function updateNotificationButton() {
  if (!("Notification" in window)) {
    notificationToggle.innerText = "Alerts Unavailable";
    notificationToggle.disabled = true;
    return;
  }

  notificationToggle.innerText = Notification.permission === "granted" ? "Alerts On" : "Enable Alerts";
  notificationToggle.disabled = Notification.permission === "denied";
}

function notifyDueTasks() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const notifiedToday = loadDueAlertHistory();
  const todayKey = new Date().toISOString().slice(0, 10);

  tasks.filter(isDueAlertTask).forEach((task) => {
    const notificationKey = `${todayKey}:${task.id}:${task.due}`;
    if (notifiedToday[notificationKey]) return;

    const dueStatus = getDueStatus(task);
    new Notification(dueStatus === "overdue" ? "Task overdue" : "Task due today", {
      body: task.title,
    });
    notifiedToday[notificationKey] = true;
  });

  localStorage.setItem(DUE_ALERTS_KEY, JSON.stringify(notifiedToday));
}

function loadDueAlertHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(DUE_ALERTS_KEY) || "{}");
    return history && typeof history === "object" && !Array.isArray(history) ? history : {};
  } catch (error) {
    console.warn("Due alert history could not be loaded.", error);
    return {};
  }
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

  createTask(title, priorityInput.value, dueInput.value, parseTags(tagInput.value));
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

    setTaskStatus(task, list.dataset.status);
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

themeToggle.addEventListener("click", () => {
  applyTheme(activeTheme === "dark" ? "light" : "dark");
});

notificationToggle.addEventListener("click", async () => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  updateNotificationButton();
  notifyDueTasks();
});

renderBoard();
updateNotificationButton();
notifyDueTasks();
setInterval(updateProgressTimers, 1000);
