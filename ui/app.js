const TOOLS_DATA_PATH = "../data/tools.json";

const dom = {
    tiles: document.getElementById("tiles"),
    filesCount: document.getElementById("files-count"),

    searchToggle: document.querySelector(".search-toggle"),
    searchToggleButton: document.getElementById("search-toggle-button"),
    searchInput: document.getElementById("tools-search"),
    searchField: document.querySelector(".search-inline-field"),

    filterButtons: document.querySelectorAll(".library-filter-button"),

    addToolButton: document.getElementById("add-tool-button"),
    wgToolButton: document.getElementById("wg-tool-button"),

    toolModal: document.getElementById("tool-modal"),
    wgModal: document.getElementById("wg-modal"),

    toolModalTitle: document.getElementById("tool-modal-title"),
    toolForm: document.getElementById("tool-form"),

    toolId: document.getElementById("tool-id"),
    toolName: document.getElementById("tool-name"),
    toolType: document.getElementById("tool-type"),
    toolLaunchMode: document.getElementById("tool-launch-mode"),
    toolPath: document.getElementById("tool-path"),
    toolWorkingDir: document.getElementById("tool-working-dir"),
    toolPythonPath: document.getElementById("tool-python-path"),
    toolDescription: document.getElementById("tool-description"),
    toolCategory: document.getElementById("tool-category"),
    toolFavorite: document.getElementById("tool-favorite"),

    toolPickFileButton: document.getElementById("tool-pick-file-button"),
    toolPickPythonButton: document.getElementById("tool-pick-python-button"),
    toolDeleteButton: document.getElementById("tool-delete-button"),

    wgConfigPath: document.getElementById("wg-config-path"),
    wgInterfaceName: document.getElementById("wg-interface-name"),
    wgResult: document.getElementById("wg-result"),
    wgGenerateButton: document.getElementById("wg-generate-button"),
    wgCopyButton: document.getElementById("wg-copy-button"),
    wgPickButton: document.getElementById("wg-pick-button"),
    wgClearButton: document.getElementById("wg-clear-button"),
};

let toolsState = [];

const viewState = {
    activeFilter: "all",
    searchQuery: "",
};

function escapeHtml(value) {
    const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    };

    return String(value).replace(/[&<>"']/g, (char) => entities[char]);
}

function formatFilesCount(count) {
    if (count % 10 === 1 && count % 100 !== 11) {
        return `${count} файл`;
    }

    if (
        count % 10 >= 2 &&
        count % 10 <= 4 &&
        (count % 100 < 12 || count % 100 > 14)
    ) {
        return `${count} файла`;
    }

    return `${count} файлов`;
}

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
        launch_count: Number(tool?.launch_count ?? 0),
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

function createTileActions(tool) {
    return `
        <div class="tile-actions">
            <button
                class="tile-button tile-button-primary"
                type="button"
                data-action="run"
                data-tool-id="${escapeHtml(tool.id)}"
            >
                Запустить
            </button>

            <button
                class="tile-button"
                type="button"
                data-action="open-folder"
                data-tool-id="${escapeHtml(tool.id)}"
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
        <article class="tile" data-tool-id="${escapeHtml(tool.id)}">
            <div class="tile-top">
                <span class="tile-tag">${escapeHtml(tool.type)}</span>
                ${createFavoriteBadge(tool)}
            </div>

            <h3>${escapeHtml(tool.name)}</h3>
            <p>${escapeHtml(tool.description)}</p>

            ${createTileActions(tool)}
        </article>
    `;
}

function renderTools(tools, options = {}) {
    const {isSearchResult = false} = options;

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

function matchesActiveFilter(tool) {
    const filter = viewState.activeFilter;

    if (filter === "all") {
        return true;
    }

    if (filter === "favorite") {
        return Boolean(tool.favorite);
    }

    if (filter === "python") {
        return String(tool.type).toLowerCase() === "python";
    }

    if (filter === "exe") {
        return String(tool.type).toLowerCase() === "exe";
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

function syncFilterButtons() {
    dom.filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === viewState.activeFilter;
        button.classList.toggle("is-active", isActive);
    });
}

function applyFilters() {
    const filteredTools = toolsState.filter((tool) => {
        return matchesActiveFilter(tool) && matchesSearch(tool);
    });

    const hasSearch = Boolean(viewState.searchQuery.trim());
    const hasCustomFilter = viewState.activeFilter !== "all";

    renderTools(filteredTools, {
        isSearchResult: hasSearch || hasCustomFilter,
    });

    syncFilterButtons();
}

function openSearch() {
    if (!dom.searchToggle) {
        return;
    }

    dom.searchToggle.classList.add("is-open");
    dom.searchToggleButton?.setAttribute("aria-expanded", "true");
    dom.searchToggleButton?.setAttribute("aria-label", "Скрыть поиск");

    requestAnimationFrame(() => dom.searchInput?.focus());
}

function closeSearch() {
    if (!dom.searchToggle) {
        return;
    }

    if (dom.searchInput?.value) {
        return;
    }

    dom.searchToggle.classList.remove("is-open");
    dom.searchToggleButton?.setAttribute("aria-expanded", "false");
    dom.searchToggleButton?.setAttribute("aria-label", "Открыть поиск");
}

function syncSearchFieldState() {
    if (!dom.searchField || !dom.searchInput) {
        return;
    }

    dom.searchField.classList.toggle(
        "has-value",
        Boolean(dom.searchInput.value.trim())
    );
}

function setupSearch() {
    if (!dom.searchToggleButton || !dom.searchInput) {
        return;
    }

    dom.searchToggleButton.addEventListener("click", () => {
        const isOpen = dom.searchToggle?.classList.contains("is-open");

        if (isOpen && document.activeElement === dom.searchInput && !dom.searchInput.value) {
            closeSearch();
            return;
        }

        openSearch();
    });

    dom.searchInput.addEventListener("input", (event) => {
        viewState.searchQuery = event.target.value;
        syncSearchFieldState();
        applyFilters();
    });

    dom.searchInput.addEventListener("blur", () => {
        closeSearch();
    });

    dom.searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            dom.searchInput.value = "";
            viewState.searchQuery = "";
            syncSearchFieldState();
            applyFilters();
            closeSearch();
            dom.searchToggleButton.focus();
        }
    });
}

function setupFilters() {
    dom.filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            viewState.activeFilter = button.dataset.filter || "all";
            applyFilters();
        });
    });
}

function openModal(modal) {
    if (!modal) {
        return;
    }

    modal.hidden = false;
}

function closeModal(modal) {
    if (!modal) {
        return;
    }

    modal.hidden = true;
}

function resetToolForm() {
    if (!dom.toolForm) {
        return;
    }

    dom.toolForm.reset();
    dom.toolId.value = "";
    dom.toolModalTitle.textContent = "Добавить инструмент";

    if (dom.toolDeleteButton) {
        dom.toolDeleteButton.hidden = true;
    }
}

function fillToolForm(tool) {
    if (!tool) {
        return;
    }

    dom.toolId.value = tool.id ?? "";
    dom.toolName.value = tool.name ?? "";
    dom.toolType.value = tool.type ?? "python";
    dom.toolLaunchMode.value = tool.launch_mode ?? "gui";
    dom.toolPath.value = tool.path ?? "";
    dom.toolWorkingDir.value = tool.working_dir ?? "";
    dom.toolPythonPath.value = tool.python_path ?? "";
    dom.toolDescription.value = tool.description ?? "";
    dom.toolCategory.value = tool.category ?? "";
    dom.toolFavorite.checked = Boolean(tool.favorite);

    dom.toolModalTitle.textContent = "Настроить инструмент";

    if (dom.toolDeleteButton) {
        dom.toolDeleteButton.hidden = false;
    }
}

function resetWireGuardForm() {
    if (dom.wgConfigPath) {
        dom.wgConfigPath.value = "";
    }

    if (dom.wgInterfaceName) {
        dom.wgInterfaceName.value = "Wireguard1";
    }

    if (dom.wgResult) {
        dom.wgResult.value = "";
    }
}

function collectToolFormData() {
    return {
        id: dom.toolId.value.trim(),
        name: dom.toolName.value.trim(),
        type: dom.toolType.value,
        launch_mode: dom.toolLaunchMode.value,
        path: dom.toolPath.value.trim(),
        working_dir: dom.toolWorkingDir.value.trim(),
        python_path: dom.toolPythonPath.value.trim(),
        description: dom.toolDescription.value.trim(),
        category: dom.toolCategory.value.trim(),
        favorite: dom.toolFavorite.checked,
        args: [],
    };
}

function setupModals() {
    dom.addToolButton?.addEventListener("click", () => {
        resetToolForm();
        openModal(dom.toolModal);
    });

    dom.wgToolButton?.addEventListener("click", () => {
        if (dom.wgInterfaceName && !dom.wgInterfaceName.value.trim()) {
            dom.wgInterfaceName.value = "Wireguard1";
        }

        openModal(dom.wgModal);
    });

    document.addEventListener("click", (event) => {
        const closeButton = event.target.closest("[data-close-modal]");
        if (!closeButton) {
            return;
        }

        const modalId = closeButton.dataset.closeModal;
        const modal = document.getElementById(modalId);

        closeModal(modal);

        if (modalId === "wg-modal") {
            resetWireGuardForm();
        }
    });

    dom.toolModal?.addEventListener("click", (event) => {
        if (event.target === dom.toolModal) {
            closeModal(dom.toolModal);
        }
    });

    dom.wgModal?.addEventListener("click", (event) => {
        if (event.target === dom.wgModal) {
            closeModal(dom.wgModal);
            resetWireGuardForm();
        }
    });
}

function setupGlobalHotkeys() {
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        if (dom.toolModal && !dom.toolModal.hidden) {
            closeModal(dom.toolModal);
            return;
        }

        if (dom.wgModal && !dom.wgModal.hidden) {
            closeModal(dom.wgModal);
            resetWireGuardForm();
        }
    });
}

function setupWindowControls() {
    document.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-window-action]");

        if (!button || !window.pywebview?.api) {
            return;
        }

        const action = button.dataset.windowAction;

        if (action === "close") {
            await window.pywebview.api.close_window();
            return;
        }

        if (action === "minimize") {
            await window.pywebview.api.minimize_window();
            return;
        }

        if (action === "toggle-maximize") {
            await window.pywebview.api.toggle_maximize_window();
        }
    });
}

async function handleTileAction(action, tool) {
    if (!tool || !window.pywebview?.api) {
        return;
    }

    if (action === "run") {
        const result = await window.pywebview.api.run_tool(tool.id);

        if (!result?.ok && result?.mode !== "capture") {
            alert(`Ошибка запуска:\n\n${result?.message ?? "Неизвестная ошибка"}`);
            return;
        }

        if (result?.mode === "capture") {
            const output = result?.output?.trim();

            if (!result?.ok) {
                alert(
                    `Команда завершилась с ошибкой.\n\n` +
                    `${result?.message ?? ""}\n\n` +
                    `${output || "Вывод отсутствует."}`
                );
            } else {
                alert(
                    `${tool.name}\n\n` +
                    `${output || "Команда выполнена, но ничего не вывела."}`
                );
            }

            const updatedTools = await window.pywebview.api.get_tools();
            toolsState = Array.isArray(updatedTools) ? updatedTools : [];
            applyFilters();
            return;
        }

        if (!result?.ok) {
            alert(`Ошибка запуска:\n\n${result?.message ?? "Неизвестная ошибка"}`);
            return;
        }

        const updatedTools = await window.pywebview.api.get_tools();
        toolsState = Array.isArray(updatedTools) ? updatedTools : [];
        applyFilters();
        return;
    }

    if (action === "open-folder") {
        const result = await window.pywebview.api.open_tool_folder(tool.id);

        if (!result?.ok) {
            alert(`Ошибка открытия папки:\n\n${result?.message ?? "Неизвестная ошибка"}`);
        }

        return;
    }

    if (action === "settings") {
        fillToolForm(tool);
        openModal(dom.toolModal);
    }
}

function setupTileActions() {
    dom.tiles?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");

        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const toolId = button.dataset.toolId;
        const tool = getToolById(toolId);

        handleTileAction(action, tool);
    });
}

function setupForms() {
    dom.toolPickFileButton?.addEventListener("click", async () => {
        if (!window.pywebview?.api?.pick_tool_file) {
            return;
        }

        const result = await window.pywebview.api.pick_tool_file();

        if (!result?.ok) {
            return;
        }

        dom.toolPath.value = result.path ?? "";
        dom.toolWorkingDir.value = result.working_dir ?? "";

        if (result.type) {
            dom.toolType.value = result.type;
        }

        if (typeof result.python_path === "string") {
            dom.toolPythonPath.value = result.python_path;
        }
    });

    dom.toolPickPythonButton?.addEventListener("click", async () => {
        if (!window.pywebview?.api?.pick_python_interpreter) {
            return;
        }

        const result = await window.pywebview.api.pick_python_interpreter();

        if (!result?.ok) {
            return;
        }

        dom.toolPythonPath.value = result.python_path ?? "";
    });

    dom.toolForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!window.pywebview?.api?.save_tool) {
            alert("Python API для сохранения пока не подключён.");
            return;
        }

        const formData = collectToolFormData();
        const result = await window.pywebview.api.save_tool(formData);

        if (!result?.ok) {
            alert(`Ошибка сохранения:\n\n${result?.message ?? "Неизвестная ошибка"}`);
            return;
        }

        closeModal(dom.toolModal);
        resetToolForm();

        const updatedTools = await window.pywebview.api.get_tools();
        toolsState = Array.isArray(updatedTools) ? updatedTools : [];
        applyFilters();
    });

    dom.toolDeleteButton?.addEventListener("click", async () => {
        const toolId = dom.toolId.value.trim();

        if (!toolId) {
            return;
        }

        const confirmed = confirm("Удалить этот инструмент из ScriptHub?");
        if (!confirmed) {
            return;
        }

        if (!window.pywebview?.api?.delete_tool) {
            alert("Python API для удаления пока не подключён.");
            return;
        }

        const result = await window.pywebview.api.delete_tool(toolId);

        if (!result?.ok) {
            alert(`Ошибка удаления:\n\n${result?.message ?? "Неизвестная ошибка"}`);
            return;
        }

        closeModal(dom.toolModal);
        resetToolForm();

        const updatedTools = await window.pywebview.api.get_tools();
        toolsState = Array.isArray(updatedTools) ? updatedTools : [];
        applyFilters();
    });

    dom.wgPickButton?.addEventListener("click", async () => {
        if (!window.pywebview?.api?.pick_wireguard_config) {
            alert("Python API выбора файла пока не подключён.");
            return;
        }

        const result = await window.pywebview.api.pick_wireguard_config();

        if (!result?.ok) {
            return;
        }

        dom.wgConfigPath.value = result.path ?? "";
    });

    dom.wgGenerateButton?.addEventListener("click", async () => {
        const configPath = dom.wgConfigPath?.value?.trim();
        const interfaceName = dom.wgInterfaceName?.value?.trim() || "Wireguard1";

        if (!configPath) {
            alert("Укажи путь к конфигу.");
            return;
        }

        if (!window.pywebview?.api?.generate_wireguard_command) {
            alert("Python API генерации WG пока не подключён.");
            return;
        }

        const result = await window.pywebview.api.generate_wireguard_command(
            configPath,
            interfaceName
        );

        if (!result?.ok) {
            alert(`Ошибка генерации:\n\n${result?.message ?? "Неизвестная ошибка"}`);
            return;
        }

        dom.wgResult.value = result.command ?? "";
    });

    dom.wgCopyButton?.addEventListener("click", async () => {
        const text = dom.wgResult?.value?.trim();

        if (!text) {
            return;
        }

        if (window.pywebview?.api?.copy_text) {
            const result = await window.pywebview.api.copy_text(text);

            if (!result?.ok) {
                alert(`Не удалось скопировать текст:\n\n${result?.message ?? "Неизвестная ошибка"}`);
            }

            return;
        }

        await navigator.clipboard.writeText(text);
    });

    dom.wgClearButton?.addEventListener("click", () => {
        resetWireGuardForm();
    });
}

async function loadTools() {
    setFilesCount(0);
    renderStateTile("Загрузка", "Подгружаю список инструментов...");

    try {
        let tools = [];

        if (window.pywebview?.api?.get_tools) {
            tools = await window.pywebview.api.get_tools();
        } else {
            const response = await fetch(TOOLS_DATA_PATH);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            tools = await response.json();
        }

        toolsState = Array.isArray(tools) ? tools : [];
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

setupWindowControls();
setupModals();
setupTileActions();
setupSearch();
setupForms();
setupFilters();
setupGlobalHotkeys();
syncSearchFieldState();
loadTools();