const apiRoot = "/api";
const state = {
    view: "overview",
    drives: [],
    volunteers: [],
    trees: [],
    dueTrees: [],
    survival: [],
    leaderboard: []
};

const $ = (selector, root = document) => root.querySelector(selector);
const today = () => new Date().toISOString().slice(0, 10);

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function formatDate(value) {
    if (!value) return "Not scheduled";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " is-error" : ""}`;
    toast.textContent = message;
    $("#toast-region").append(toast);
    window.setTimeout(() => toast.remove(), 4300);
}

function setApiStatus(status, label) {
    const element = $("#api-status");
    element.classList.toggle("is-connected", status === "connected");
    element.classList.toggle("is-error", status === "error");
    element.innerHTML = `<span class="status-dot"></span>${escapeHtml(label)}`;
}

async function request(path, options = {}) {
    const response = await fetch(`${apiRoot}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const text = await response.text();
    let body = null;
    if (text) {
        try { body = JSON.parse(text); } catch { body = { error: text }; }
    }
    if (!response.ok) {
        throw new Error(body?.error || body?.message || `Request failed (${response.status})`);
    }
    return body;
}

async function refreshData() {
    setApiStatus("loading", "Syncing");
    try {
        const [drives, volunteers, trees, dueTrees, survival, leaderboard] = await Promise.all([
            request("/drives"),
            request("/volunteers"),
            request("/trees"),
            request("/trees/due"),
            request("/reports/survival-rate"),
            request("/reports/leaderboard")
        ]);
        Object.assign(state, { drives, volunteers, trees, dueTrees, survival, leaderboard });
        setApiStatus("connected", "API connected");
        render();
    } catch (error) {
        setApiStatus("error", "API unavailable");
        showToast(error.message || "Could not load GreenLog data", true);
        render();
    }
}

function showView(name) {
    state.view = name;
    document.querySelectorAll(".view").forEach(view => {
        const active = view.id === `view-${name}`;
        view.classList.toggle("is-visible", active);
        view.hidden = !active;
    });
    document.querySelectorAll(".nav-link").forEach(link => link.classList.toggle("is-active", link.dataset.view === name));
    const activeLink = $(`.nav-link[data-view="${name}"]`);
    $("#current-section").textContent = activeLink?.textContent.trim().replace(/^\d+/, "").trim() || "Overview";
    render();
}

function table(headers, rows, emptyTitle, emptyMessage) {
    if (!rows.length) return `<div class="empty-state"><strong>${escapeHtml(emptyTitle)}</strong>${escapeHtml(emptyMessage)}</div>`;
    return `<table><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

function emptyWithAction(title, message, actionLabel, view) {
    return `<div class="empty-state"><strong>${escapeHtml(title)}</strong>${escapeHtml(message)} <button class="text-button" type="button" data-open="${escapeHtml(view)}">${escapeHtml(actionLabel)}</button></div>`;
}

function treeActions(tree) {
    const history = `<button class="row-action" type="button" data-action="history" data-id="${tree.id}">History</button>`;
    const checkin = tree.status === "DEAD" ? "" : `<button class="row-action" type="button" data-action="checkin" data-id="${tree.id}">Check in</button>`;
    return `${checkin}${history}`;
}

function renderOverview() {
    const alive = state.trees.filter(tree => tree.status !== "DEAD").length;
    const rate = state.trees.length ? Math.round(alive * 10000 / state.trees.length) / 100 : 0;
    $("#metric-total").textContent = state.trees.length;
    $("#metric-alive").textContent = alive;
    $("#metric-rate").textContent = `${rate}%`;
    $("#metric-volunteers").textContent = state.volunteers.length;
    $("#today-label").textContent = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }).toUpperCase();

    const dueRows = state.dueTrees.slice(0, 5).map(tree => `<tr>
        <td>${escapeHtml(tree.species)} <span class="table-id">#${tree.id}</span></td>
        <td>${escapeHtml(tree.drive?.location || tree.drive?.name || "-")}</td>
        <td>${formatDate(tree.nextCheckInDate)}</td>
        <td>${treeActions(tree)}</td>
    </tr>`);
    $("#overview-due").innerHTML = state.dueTrees.length
        ? table(["Tree", "Location", "Due date", ""], dueRows, "No check-ins due", "")
        : `<div class="empty-state"><strong>All caught up</strong>No trees are due for a check-in today.</div>`;

    const groups = state.trees.reduce((counts, tree) => {
        const name = tree.species || "Unspecified";
        counts[name] = (counts[name] || 0) + 1;
        return counts;
    }, {});
    const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const highest = Math.max(1, ...entries.map(([, count]) => count));
    $("#species-summary").innerHTML = entries.length ? entries.map(([name, count]) => `
        <div class="species-row"><span class="species-name">${escapeHtml(name)}</span><span class="species-count">${count}</span>
        <div class="species-track"><span style="width:${Math.round(count * 100 / highest)}%"></span></div></div>`).join("")
        : `<div class="empty-state">No trees recorded yet.</div>`;
}

function renderTrees() {
    const search = $("#tree-search").value.trim().toLowerCase();
    const filter = $("#tree-status-filter").value;
    const trees = state.trees.filter(tree => {
        const text = `${tree.species || ""} ${tree.drive?.name || ""} ${tree.drive?.location || ""}`.toLowerCase();
        return (!search || text.includes(search)) && (filter === "all" || tree.status === filter);
    });
    $("#tree-count").textContent = `${trees.length} ${trees.length === 1 ? "tree" : "trees"}`;
    const rows = trees.map(tree => `<tr>
        <td>${escapeHtml(tree.species)} <span class="table-id">#${tree.id}</span></td>
        <td>${escapeHtml(tree.drive?.name || "-")}</td>
        <td>${escapeHtml(tree.plantedBy?.name || "-")}</td>
        <td>${formatDate(tree.datePlanted)}</td>
        <td>${formatDate(tree.nextCheckInDate)}</td>
        <td><span class="status-pill${tree.status === "DEAD" ? " dead" : ""}">${tree.status === "DEAD" ? "Dead" : "Alive"}</span></td>
        <td>${treeActions(tree)}</td>
    </tr>`);
    $("#trees-table").innerHTML = state.trees.length
        ? table(["Species", "Drive", "Planted by", "Planted", "Next check-in", "Status", ""], rows, "No matching trees", "Try another search or filter.")
        : emptyWithAction("No trees yet", "Start the register with your first planting.", "Log a tree", "tree");
}

function renderDrives() {
    const rows = state.drives.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).map(drive => {
        const count = state.trees.filter(tree => tree.drive?.id === drive.id).length;
        return `<tr><td>${escapeHtml(drive.name)} <span class="table-id">#${drive.id}</span></td><td>${escapeHtml(drive.location)}</td><td>${formatDate(drive.date)}</td><td>${count}</td></tr>`;
    });
    $("#drives-table").innerHTML = state.drives.length
        ? table(["Drive", "Location", "Date", "Trees planted"], rows, "No drives found", "")
        : emptyWithAction("No drives yet", "Create a drive before logging its trees.", "Create a drive", "drive");
}

function renderVolunteers() {
    $("#volunteer-count").textContent = `${state.volunteers.length} TOTAL`;
    const rows = state.volunteers.map(volunteer => {
        const planted = state.trees.filter(tree => tree.plantedBy?.id === volunteer.id).length;
        return `<tr><td>${escapeHtml(volunteer.name)} <span class="table-id">#${volunteer.id}</span></td><td>${escapeHtml(volunteer.email)}</td><td>${planted}</td></tr>`;
    });
    $("#volunteers-table").innerHTML = state.volunteers.length
        ? table(["Volunteer", "Email", "Trees planted"], rows, "No volunteers yet", "")
        : emptyWithAction("No volunteers yet", "Add someone to your planting community.", "Add volunteer", "volunteer");
    $("#leaderboard-list").innerHTML = state.leaderboard.length ? state.leaderboard.slice(0, 8).map((entry, index) => `
        <div class="leader-row"><span class="leader-rank">${String(index + 1).padStart(2, "0")}</span><span class="leader-name">${escapeHtml(entry.volunteerName)}</span><span class="leader-trees">${entry.treesPlanted} trees</span></div>`).join("")
        : `<div class="empty-state">Planting contributions will appear here.</div>`;
}

function renderReports() {
    const survivalRows = state.survival.map(row => `<tr>
        <td>${escapeHtml(row.driveName || `Drive #${row.driveId}`)} <span class="table-id">#${row.driveId}</span></td>
        <td>${escapeHtml(row.species)}</td><td>${row.totalTrees}</td><td>${row.aliveTrees}</td>
        <td class="rate-cell"><strong>${Number(row.survivalRate).toFixed(2)}%</strong><span class="rate-track"><span style="width:${Math.max(0, Math.min(100, Number(row.survivalRate)))}%"></span></span></td>
    </tr>`);
    $("#survival-table").innerHTML = table(["Drive", "Species", "Total trees", "Alive", "Survival rate"], survivalRows, "No survival data yet", "Plant trees to see survival rates.");
    const leaderboardRows = state.leaderboard.map((entry, index) => `<tr><td>${String(index + 1).padStart(2, "0")}</td><td>${escapeHtml(entry.volunteerName)}</td><td>${entry.treesPlanted}</td></tr>`);
    $("#report-leaderboard").innerHTML = table(["Rank", "Volunteer", "Trees planted"], leaderboardRows, "No leaderboard data yet", "Planting contributions will appear here.");
}

function render() {
    if (state.view === "overview") renderOverview();
    if (state.view === "trees") renderTrees();
    if (state.view === "drives") renderDrives();
    if (state.view === "volunteers") renderVolunteers();
    if (state.view === "reports") renderReports();
}

function fillSelect(select, items, placeholder, labelFor) {
    const previous = select.value;
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${items.map(item => `<option value="${item.id}">${escapeHtml(labelFor(item))}</option>`).join("")}`;
    if (items.some(item => String(item.id) === previous)) select.value = previous;
}

function openDialog(name) {
    const dialog = $(`#${name}-dialog`);
    if (!dialog) return;
    const form = $("form", dialog);
    form?.querySelectorAll(".form-message").forEach(message => message.textContent = "");
    if (name === "drive") $("input[name='date']", dialog).value = today();
    if (name === "tree") {
        fillSelect($("select[name='driveId']", dialog), state.drives, "Choose a drive", item => item.name);
        fillSelect($("select[name='volunteerId']", dialog), state.volunteers, "Choose a volunteer", item => item.name);
        $("input[name='datePlanted']", dialog).value = today();
    }
    if (name === "checkin") {
        fillSelect($("select[name='volunteerId']", dialog), state.volunteers, "Choose a volunteer", item => item.name);
        $("input[name='checkInDate']", dialog).value = today();
    }
    dialog.showModal();
}

function formMessage(form, message) {
    const target = $(".form-message", form);
    if (target) target.textContent = message;
}

async function submitForm(form, path, body, successMessage) {
    const submit = $("button[type='submit']", form);
    submit.disabled = true;
    formMessage(form, "");
    try {
        await request(path, { method: "POST", body: JSON.stringify(body) });
        $("dialog[open]").close();
        form.reset();
        showToast(successMessage);
        await refreshData();
    } catch (error) {
        formMessage(form, error.message || "Could not save this record");
    } finally {
        submit.disabled = false;
    }
}

async function showHistory(treeId) {
    const dialog = $("#history-dialog");
    const tree = state.trees.find(item => String(item.id) === String(treeId));
    $("#history-dialog-title").textContent = `${tree?.species || "Tree"} check-in history`;
    $("#history-content").innerHTML = `<div class="empty-state">Loading check-ins...</div>`;
    dialog.showModal();
    try {
        const entries = await request(`/checkins/tree/${encodeURIComponent(treeId)}`);
        const rows = entries.map(entry => `<tr><td>${formatDate(entry.checkInDate)}</td><td>${escapeHtml(entry.volunteer?.name || "-")}</td><td><span class="status-pill${entry.alive ? "" : " dead"}">${entry.alive ? "Alive" : "Dead"}</span></td></tr>`);
        $("#history-content").innerHTML = table(["Date", "Recorded by", "Status"], rows, "No check-ins yet", "This tree has no check-in history.");
    } catch (error) {
        $("#history-content").innerHTML = `<div class="empty-state"><strong>Could not load history</strong>${escapeHtml(error.message)}</div>`;
    }
}

document.addEventListener("click", event => {
    const nav = event.target.closest("[data-view]");
    if (nav) showView(nav.dataset.view);

    const viewLink = event.target.closest("[data-view-link]");
    if (viewLink) showView(viewLink.dataset.viewLink);

    const opener = event.target.closest("[data-open]");
    if (opener) openDialog(opener.dataset.open);

    const closer = event.target.closest("[data-close]");
    if (closer) $(`#${closer.dataset.close}`).close();

    const action = event.target.closest("[data-action]");
    if (action?.dataset.action === "history") showHistory(action.dataset.id);
    if (action?.dataset.action === "checkin") {
        const tree = state.trees.find(item => String(item.id) === action.dataset.id);
        if (tree) {
            $("input[name='treeId']", $("#checkin-form")).value = tree.id;
            $("#checkin-tree-label").textContent = `${tree.species} - tree #${tree.id}`;
            openDialog("checkin");
        }
    }
});

$("#drive-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    submitForm(form, "/drives", { name: values.get("name").trim(), location: values.get("location").trim(), date: values.get("date") }, "Plantation drive created");
});

$("#volunteer-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    submitForm(form, "/volunteers", { name: values.get("name").trim(), email: values.get("email").trim() }, "Volunteer added");
});

$("#tree-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    submitForm(form, "/trees", {
        species: values.get("species").trim(),
        datePlanted: values.get("datePlanted"),
        drive: { id: Number(values.get("driveId")) },
        plantedBy: { id: Number(values.get("volunteerId")) }
    }, "Tree added to the register");
});

$("#checkin-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    submitForm(form, "/checkins", {
        checkInDate: values.get("checkInDate"),
        alive: values.get("alive") === "true",
        tree: { id: Number(values.get("treeId")) },
        volunteer: { id: Number(values.get("volunteerId")) }
    }, "Check-in recorded");
});

$("#tree-search").addEventListener("input", renderTrees);
$("#tree-status-filter").addEventListener("change", renderTrees);
$("#refresh-button").addEventListener("click", refreshData);
$("#reports-refresh").addEventListener("click", refreshData);

document.querySelectorAll("dialog").forEach(dialog => {
    dialog.addEventListener("click", event => {
        if (event.target === dialog) dialog.close();
    });
});

refreshData();