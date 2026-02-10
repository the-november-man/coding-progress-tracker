// ================= THEME =================
let questions = [];
const dark = JSON.parse(localStorage.getItem("darkMode")) || false;
if (dark) document.body.classList.add("dark");

window.toggleTheme = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode",
    JSON.stringify(document.body.classList.contains("dark")));
};

// ================= ADD QUESTION =================
window.addQuestion = () => {
  if (!qName.value || !qLink.value) return alert("Name & link required");

  questions.push({
    name: qName.value,
    link: qLink.value,
    tags: qTags.value.split(",").map(t => t.trim()).filter(Boolean),
    difficulty: qDifficulty.value,
    completed: false,
    revised: false
  });

  qName.value = qLink.value = qTags.value = "";
  save();
  render();
};

// ================= RENDER =================
window.render = () => {
  const tagSet = new Set();
  questions.forEach(q => q.tags.forEach(t => tagSet.add(t)));

  tagFilter.innerHTML = `<option value="all">All Tags</option>`;
  [...tagSet].sort().forEach(t =>
    tagFilter.innerHTML += `<option value="${t}">${t}</option>`
  );

  tableBody.innerHTML = "";

  questions
    .filter(q =>
      (tagFilter.value === "all" || q.tags.includes(tagFilter.value)) &&
      (difficultyFilter.value === "all" || q.difficulty === difficultyFilter.value)
    )
    .forEach((q, i) => {
      tableBody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${q.name}</td>
        <td>
          <a class="leetcode-link" href="${q.link}" target="_blank">
            <img src="assets/leetcode.svg">
          </a>
        </td>
        <td>${q.tags.map(t => `<span class="tag">${t}</span>`).join("")}</td>
        <td><span class="diff ${q.difficulty}">${q.difficulty}</span></td>
        <td class="center">
          <input class="checkbox" type="checkbox" ${q.completed ? "checked" : ""}
            onchange="questions[${i}].completed=this.checked;save();render();">
        </td>
        <td class="center">
          <input class="checkbox" type="checkbox" ${q.revised ? "checked" : ""}
            onchange="questions[${i}].revised=this.checked;save();render();">
        </td>
      </tr>`;
    });

  updateProgress();
};

// ================= PROGRESS =================
function updateProgress() {
  const done = questions.filter(q => q.completed).length;
  const pct = questions.length ? Math.round(done / questions.length * 100) : 0;
  progressBar.style.width = pct + "%";
  progressText.textContent = `${pct}% completed (${done}/${questions.length})`;
}

// ================= IMPORT / EXPORT =================
window.exportJSON = () => {
  const blob = new Blob(
    [JSON.stringify(questions, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "coding-tracker-backup.json";
  a.click();
};

window.toggleImport = () => {
  importBox.style.display =
    importBox.style.display === "none" ? "block" : "none";
};

window.importJSON = (append) => {
  try {
    const data = JSON.parse(importArea.value);

    if (!Array.isArray(data)) {
      alert("Invalid JSON format");
      return;
    }

    // Basic validation
    data.forEach(q => {
      if (!q.name || !q.link) throw new Error();
      q.tags = q.tags || [];
      q.completed ??= false;
      q.revised ??= false;
      q.difficulty ??= "easy";
    });

    questions = append ? questions.concat(data) : data;

    save();
    render();

    importArea.value = "";
    importBox.style.display = "none";
  } catch {
    alert("Invalid JSON");
  }
};

// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDl4zL9enxU5JMjb_eXbauS7yRqCDUh1Qk",
  authDomain: "coding-tracker-4feea.firebaseapp.com",
  projectId: "coding-tracker-4feea",
  appId: "1:981547014067:web:c22a572d5dec8df8b9ddc6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let userId = null;

signInAnonymously(auth).then(res => {
  userId = res.user.uid;
  const ref = doc(db, "users", userId);

  onSnapshot(ref, snap => {
    if (snap.exists()) {
      questions = snap.data().questions || [];
      render();
    }
  });
});

window.save = async () => {
  if (!userId) return;
  await setDoc(doc(db, "users", userId), {
    questions,
    updatedAt: Date.now()
  });
};
