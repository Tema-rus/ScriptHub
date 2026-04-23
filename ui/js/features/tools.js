import { dom } from "../core/dom.js";
import {
    toolsState,
    viewState,
    setToolsState,
} from "../core/state.js";
import {
    escapeHtml,
    formatFilesCount,
    formatLastLaunch,
    waitForPywebviewApi,
} from "../core/utils.js";
import { showToast } from "../ui/toasts.js";

const TOOLS_DATA_PATH = "../data/tools.json";

function setFilesCount(count) {
    if (dom.filesCount) {
        dom.filesCount.textContent = formatFilesCount(count);
    }
}

function normalizeTool(tool) {
    return {
        id: tool?.id ?? "",
        type: tool?.type ?? "tool",
        launch_mode: tool?.launch_mode ?? "gui",
        name: tool?.name ?? "Без названия",
        description: tool?.description ?? "Описание пока не указано.",
        category: tool?.category ?? "",
        favorite: Boolean(tool?.favorite),
        path: tool?.path ?? "",
        working_dir: tool?.working_dir ?? "",
        python_path: tool?.python_path ?? "",
        args: Array.isArray(tool?.args) ? tool.args : [],
        launch_count: Number(tool?.launch_count ?? 0),
        last_launch_at: tool?.last_launch_at ?? null,
        path_exists: Boolean(tool?.path_exists ?? true),
        working_dir_exists: Boolean(tool?.working_dir_exists ?? true),
        python_path_exists: Boolean(tool?.python_path_exists ?? true),
        is_runnable: Boolean(tool?.is_runnable ?? true),
        status_message: tool?.status_message ?? "",
    };
}

function getToolById(toolId) {
    return toolsState.find((tool) => String(tool.id) === String(toolId));
}

function renderStateTile(title, message, tag = "info") {
    dom.tiles.innerHTML = `
        <article class="tile tile-empty">
            <span class="tile-tag">${escapeHtml(tag)}</span>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(message)}</p>
        </article>
    `;
}

function createFavoriteBadge(tool) {
    return tool.favorite
        ? '<span class="tile-favorite-badge">избранное</span>'
        : "";
}

function getToolTypeIcon(type) {
    const normalized = String(type || "").toLowerCase();

    if (normalized === "python") {
        return `
            <svg class="tile-type-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 4H14C16.8 4 18 5.2 18 8V10H10C8.3 10 7 11.3 7 13V16H6C3.8 16 3 14.8 3 12.7V10C3 6 5 4 9 4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path>
                <path d="M15 20H10C7.2 20 6 18.8 6 16V14H14C15.7 14 17 12.7 17 11V8H18C20.2 8 21 9.2 21 11.3V14C21 18 19 20 15 20Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path>
                <circle cx="8.5" cy="7.5" r="0.9" fill="currentColor"></circle>
                <circle cx="15.5" cy="16.5" r="0.9" fill="currentColor"></circle>
            </svg>
        `;
    }

    if (normalized === "exe") {
        return `
            <svg class="tile-type-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="4.5" width="14" height="15" rx="2.5" stroke="currentColor" stroke-width="1.7"></rect>
                <path d="M8 9H16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path>
                <path d="M8 13H13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path>
            </svg>
        `;
    }

    if (normalized === "bat") {
        return `
            <svg class="tile-type-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 7.5L10 11.5L6 15.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M12.5 15.5H17.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
            </svg>
        `;
    }

    if (normalized === "ps1") {
        return `
            <svg class="tile-type-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 7.5L10 11.5L6 15.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M12.5 15.5H18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                <path d="M13 7.5H18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
            </svg>
        `;
    }

    return "";
}

function createTileMeta(tool) {
    return `
        <div class="tile-meta">
            <span class="tile-meta-item">Запусков: ${escapeHtml(tool.launch_count)}</span>
            <span class="tile-meta-item">Последний запуск: ${escapeHtml(formatLastLaunch(tool.last_launch_at))}</span>
        </div>
    `;
}

function createToolStatus(tool) {
    if (tool.is_runnable) {
        return "";
    }

    return `
        <div class="tile-status tile-status-warning">
            ${escapeHtml(tool.status_message || "Есть проблема с путём запуска")}
        </div>
    `;
}

function createTileActions(tool) {
    const runDisabled = !tool.is_runnable ? "disabled" : "";
    const openFolderDisabled = !tool.working_dir_exists ? "disabled" : "";

    return `
        <div class="tile-actions">
            <button
                class="tile-button tile-button-primary"
                type="button"
                data-action="run"
                data-tool-id="${escapeHtml(tool.id)}"
                ${runDisabled}
            >
                Запустить
            </button>

            <button
                class="tile-button"
                type="button"
                data-action="open-folder"
                data-tool-id="${escapeHtml(tool.id)}"
                ${openFolderDisabled}
            >
                Папка
            </button>

            <button
                class="tile-button"
                type="button"
                data-action="settings"
                data-tool-id="${escapeHtml(tool.id)}"
            >
                Настроить
            </button>
        </div>
    `;
}

function createTileHtml(rawTool) {
    const tool = normalizeTool(rawTool);

    return `
        <article class="tile ${tool.is_runnable ? "" : "tile-warning"}" data-tool-id="${escapeHtml(tool.id)}">
            <div class="tile-top">
                <div class="tile-type-group">
                    ${getToolTypeIcon(tool.type)}
                    <span class="tile-tag">${escapeHtml(tool.type)}</span>
                </div>
                ${createFavoriteBadge(tool)}
            </div>

            <h3>${escapeHtml(tool.name)}</h3>
            <p>${escapeHtml(tool.description)}</p>

            ${createTileMeta(tool)}
            ${createToolStatus(tool)}
            ${createTileActions(tool)}
        </article>
    `;
}

function renderTools(tools, options = {}) {
    const { isSearchResult = false } = options;

    if (!Array.isArray(tools) || tools.length === 0) {
        setFilesCount(0);

        if (isSearchResult) {
            renderStateTile(
                "Ничего не найдено",
                "Попробуй изменить поисковый запрос или фильтр."
            );
            return;
        }

        renderStateTile(
            "Пока пусто",
            "Добавь первый инструмент, когда будешь готов."
        );
        return;
    }

    dom.tiles.innerHTML = tools.map(createTileHtml).join("");
    setFilesCount(tools.length);
}

function getFilterTypeLabel(type) {
    const normalized = String(type || "").toLowerCase();

    if (normalized === "python") {
        return "Python";
    }

    if (normalized === "exe") {
        return "EXE";
    }

    if (normalized === "bat") {
        return "BAT / CMD";
    }

    if (normalized === "ps1") {
        return "PowerShell";
    }

    return normalized.toUpperCase();
}

function refreshFilterOptions() {
    if (!dom.filterSelect) {
        return;
    }

    const currentValue = viewState.activeFilter || "all";

    const typeOptions = [...new Set(
        toolsState
            .map((tool) => String(tool?.type || "").toLowerCase().trim())
            .filter(Boolean)
    )].sort();

    const options = [
        { value: "all", label: "Все инструменты" },
        { value: "favorite", label: "Избранное" },
        ...typeOptions.map((type) => ({
            value: `type:${type}`,
            label: getFilterTypeLabel(type),
        })),
    ];

    dom.filterSelect.innerHTML = options.map((option) => `
        <option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>
    `).join("");

    const hasCurrent = options.some((option) => option.value === currentValue);

    if (hasCurrent) {
        dom.filterSelect.value = currentValue;
    } else {
        viewState.activeFilter = "all";
        dom.filterSelect.value = "all";
    }
}

function matchesActiveFilter(tool) {
    const filter = viewState.activeFilter;

    if (filter === "all") {
        return true;
    }

    if (filter === "favorite") {
        return Boolean(tool.favorite);
    }

    if (filter.startsWith("type:")) {
        const toolType = filter.slice(5);
        return String(tool.type).toLowerCase() === toolType;
    }

    return true;
}

function matchesSearch(tool) {
    const query = viewState.searchQuery.trim().toLowerCase();

    if (!query) {
        return true;
    }

    return [tool.name, tool.type, tool.description, tool.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
}

function syncFilterSelect() {
    if (!dom.filterSelect) {
        return;
    }

    dom.filterSelect.value = viewState.activeFilter;
}

export function applyFilters() {
    refreshFilterOptions();

    const filteredTools = toolsState.filter((tool) => {
        return matchesActiveFilter(tool) && matchesSearch(tool);
    });

    const hasSearch = Boolean(viewState.searchQuery.trim());
    const hasCustomFilter = viewState.activeFilter !== "all";

    renderTools(filteredTools, {
        isSearchResult: hasSearch || hasCustomFilter,
    });

    syncFilterSelect();
}

export function setupFilters() {
    dom.filterSelect?.addEventListener("change", () => {
        viewState.activeFilter = dom.filterSelect.value || "all";
        applyFilters();
    });
}

async function handleTileAction(action, tool, onEditTool) {
    if (!tool || !window.pywebview?.api) {
        return;
    }

    if (action === "run") {
        const result = await window.pywebview.api.run_tool(tool.id);

        if (!result?.ok && result?.mode !== "capture") {
            showToast({
                title: "Ошибка запуска",
                message: result?.message ?? "Неизвестная ошибка",
                type: "error",
                duration: 5000,
            });
            return;
        }

        if (result?.mode === "capture") {
            const output = result?.output?.trim();

            if (!result?.ok) {
                showToast({
                    title: "Команда завершилась с ошибкой",
                    message: `${result?.message ?? ""}\n\n${output || "Вывод отсутствует."}`.trim(),
                    type: "error",
                    duration: 6000,
                });
            } else {
                showToast({
                    title: tool.name,
                    message: output || "Команда выполнена, но ничего не вывела.",
                    type: "success",
                    duration: 5000,
                });
            }

            const updatedTools = await window.pywebview.api.get_tools();
            setToolsState(updatedTools);
            applyFilters();
            return;
        }

        if (!result?.ok) {
            showToast({
                title: "Ошибка запуска",
                message: result?.message ?? "Неизвестная ошибка",
                type: "error",
                duration: 5000,
            });
            return;
        }

        showToast({
            title: "Запущено",
            message: tool.name,
            type: "success",
            duration: 2500,
        });

        const updatedTools = await window.pywebview.api.get_tools();
        setToolsState(updatedTools);
        applyFilters();
        return;
    }

    if (action === "open-folder") {
        const result = await window.pywebview.api.open_tool_folder(tool.id);

        if (!result?.ok) {
            showToast({
                title: "Ошибка открытия папки",
                message: result?.message ?? "Неизвестная ошибка",
                type: "error",
                duration: 5000,
            });
            return;
        }

        showToast({
            title: "Папка открыта",
            message: tool.name,
            type: "info",
            duration: 2200,
        });

        return;
    }

    if (action === "settings" && typeof onEditTool === "function") {
        onEditTool(tool);
    }
}

export function setupTileActions(onEditTool) {
    dom.tiles?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");

        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const toolId = button.dataset.toolId;
        const tool = getToolById(toolId);

        handleTileAction(action, tool, onEditTool);
    });
}

export async function loadTools() {
    setFilesCount(0);
    renderStateTile("Загрузка", "Подгружаю список инструментов...");

    try {
        let tools = [];
        const hasPywebviewApi = await waitForPywebviewApi();

        if (hasPywebviewApi && window.pywebview?.api?.get_tools) {
            tools = await window.pywebview.api.get_tools();
        } else {
            const response = await fetch(TOOLS_DATA_PATH);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            tools = await response.json();
        }

        setToolsState(tools);
        viewState.searchQuery = dom.searchInput?.value ?? "";
        applyFilters();
    } catch (error) {
        console.error("Ошибка загрузки tools:", error);
        setFilesCount(0);
        renderStateTile(
            "Не удалось загрузить проекты",
            "Проверь tools.json или Python API.",
            "error"
        );
    }
}