let questions = JSON.parse(localStorage.getItem("questions") || "[]");

const tableBody = document.getElementById("tableBody");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const tagFilter = document.getElementById("tagFilter");
const difficultyFilter = document.getElementById("difficultyFilter");

/* ---------- UTIL ---------- */
function save() {
  localStorage.setItem("questions", JSON.stringify(questions));
}

function normalize(q) {
  q.tags = (q.tags || []).map(t => t.toLowerCase());
  q.difficulty = (q.difficulty || "easy").toLowerCase();
  q.completed ??= false;
  q.revised ??= false;
  return q;
}

/* ---------- THEME ---------- */
function toggleTheme() {
  document.body.classList.toggle("dark");
}

/* ---------- ADD ---------- */
function addQuestion() {
  const q = normalize({
    name: qName.value.trim(),
    link: qLink.value.trim(),
    tags: qTags.value.split(",").map(t => t.trim()).filter(Boolean),
    difficulty: qDifficulty.value
  });

  if (!q.name) return;

  questions.push(q);
  save();
  render();

  qName.value = qLink.value = qTags.value = "";
}

/* ---------- IMPORT / EXPORT ---------- */
function exportJSON() {
  const blob = new Blob([JSON.stringify(questions, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "questions.json";
  a.click();
}

function toggleImport() {
  importBox.style.display = importBox.style.display === "none" ? "block" : "none";
}

function importJSON(append) {
  try {
    const data = JSON.parse(importArea.value).map(normalize);
    questions = append ? questions.concat(data) : data;
    save();
    render();
    importArea.value = "";
  } catch {
    alert("Invalid JSON");
  }
}

/* ---------- RENDER ---------- */
function render() {
  tableBody.innerHTML = "";

  const filtered = questions.filter(q =>
    (tagFilter.value === "all" || q.tags.includes(tagFilter.value)) &&
    (difficultyFilter.value === "all" || q.difficulty === difficultyFilter.value)
  );

  filtered.forEach((q, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${q.name}</td>
      <td class="center">
        <a class="leetcode-link" href="${q.link}" target="_blank">
          <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png">
        </a>
      </td>
      <td>${q.tags.map(t => `<span class="tag">${t}</span>`).join("")}</td>
      <td><span class="diff ${q.difficulty}">${q.difficulty}</span></td>
      <td class="center"><input type="checkbox" class="checkbox" ${q.completed ? "checked" : ""}></td>
      <td class="center"><input type="checkbox" class="checkbox" ${q.revised ? "checked" : ""}></td>
    `;

    tr.querySelectorAll("input").forEach((cb, idx) => {
      cb.onchange = () => {
        idx === 0 ? q.completed = cb.checked : q.revised = cb.checked;
        save();
        render();
      };
    });

    tableBody.appendChild(tr);
  });

  updateProgress();
  updateTagFilter();
}

/* ---------- PROGRESS ---------- */
function updateProgress() {
  const done = questions.filter(q => q.completed).length;
  const total = questions.length;
  const pct = total ? Math.round(done / total * 100) : 0;
  progressBar.style.width = pct + "%";
  progressText.textContent = `${done} / ${total} completed (${pct}%)`;
}

/* ---------- TAG FILTER ---------- */
function updateTagFilter() {
  const tags = [...new Set(questions.flatMap(q => q.tags))];
  tagFilter.innerHTML = `<option value="all">All</option>` +
    tags.map(t => `<option value="${t}">${t}</option>`).join("");
}

tagFilter.onchange = difficultyFilter.onchange = render;

/* ---------- INIT ---------- */
questions = questions.map(normalize);
render();
