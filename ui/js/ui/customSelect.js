const instances = new WeakMap();
let openedInstance = null;
let globalHandlersBound = false;

function createArrowIcon() {
    return `
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5L10 12.5L15 7.5"></path>
        </svg>
    `;
}

class CustomSelect {
    constructor(select) {
        this.select = select;
        this.shell = select.closest(".select-shell") ?? select.parentElement;
        this.root = document.createElement("div");
        this.button = document.createElement("button");
        this.label = document.createElement("span");
        this.arrow = document.createElement("span");
        this.panel = document.createElement("div");
        this.observer = null;

        this.build();
        this.bind();
        this.renderOptions();
        this.syncFromNative();
        this.observe();
    }

    build() {
        this.shell?.classList.add("has-custom-select");

        this.select.classList.add("custom-select-native");
        this.select.tabIndex = -1;

        this.root.className = "custom-select";

        this.button.type = "button";
        this.button.className = "custom-select-button";
        this.button.setAttribute("aria-haspopup", "listbox");
        this.button.setAttribute("aria-expanded", "false");

        this.label.className = "custom-select-label";

        this.arrow.className = "custom-select-arrow";
        this.arrow.innerHTML = createArrowIcon();

        this.panel.className = "custom-select-panel";
        this.panel.hidden = true;
        this.panel.setAttribute("role", "listbox");

        this.button.append(this.label, this.arrow);
        this.root.append(this.button, this.panel);

        this.select.insertAdjacentElement("afterend", this.root);
    }

    bind() {
        this.button.addEventListener("click", (event) => {
            event.stopPropagation();
            this.toggle();
        });

        this.panel.addEventListener("click", (event) => {
            const optionButton = event.target.closest(".custom-select-option");
            if (!optionButton || optionButton.disabled) {
                return;
            }

            const value = optionButton.dataset.value ?? "";
            this.choose(value);
        });

        this.button.addEventListener("keydown", (event) => {
            if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                this.open();
                this.focusSelectedOption();
                return;
            }

            if (event.key === "Escape") {
                this.close();
            }
        });

        this.panel.addEventListener("keydown", (event) => {
            const options = this.getOptionButtons();
            const currentIndex = options.indexOf(document.activeElement);

            if (event.key === "Escape") {
                event.preventDefault();
                this.close();
                this.button.focus();
                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
                options[nextIndex]?.focus();
                return;
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                const nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
                options[nextIndex]?.focus();
                return;
            }

            if (event.key === "Home") {
                event.preventDefault();
                options[0]?.focus();
                return;
            }

            if (event.key === "End") {
                event.preventDefault();
                options[options.length - 1]?.focus();
            }
        });

        this.select.addEventListener("change", () => {
            this.syncFromNative();
        });
    }

    observe() {
        this.observer = new MutationObserver(() => {
            this.renderOptions();
            this.syncFromNative();
        });

        this.observer.observe(this.select, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["disabled", "selected", "label", "value"],
        });
    }

    getOptionButtons() {
        return [...this.panel.querySelectorAll(".custom-select-option:not(:disabled)")];
    }

    getCurrentOption() {
        return this.select.selectedOptions?.[0] ?? this.select.options?.[0] ?? null;
    }

    renderOptions() {
        const options = [...this.select.options];

        this.panel.innerHTML = "";

        for (const option of options) {
            if (option.hidden) {
                continue;
            }

            const button = document.createElement("button");
            button.type = "button";
            button.className = "custom-select-option";
            button.dataset.value = option.value;
            button.setAttribute("role", "option");
            button.textContent = option.textContent ?? "";

            if (option.disabled) {
                button.disabled = true;
            }

            if (option.selected) {
                button.classList.add("is-selected");
                button.setAttribute("aria-selected", "true");
            } else {
                button.setAttribute("aria-selected", "false");
            }

            this.panel.append(button);
        }
    }

    syncFromNative() {
        const currentOption = this.getCurrentOption();

        this.label.textContent = currentOption?.textContent?.trim() || "Выбрать";

        const isDisabled = this.select.disabled;
        this.button.disabled = isDisabled;
        this.root.classList.toggle("is-disabled", isDisabled);

        for (const optionButton of this.panel.querySelectorAll(".custom-select-option")) {
            const isSelected = optionButton.dataset.value === this.select.value;
            optionButton.classList.toggle("is-selected", isSelected);
            optionButton.setAttribute("aria-selected", isSelected ? "true" : "false");
        }
    }

    focusSelectedOption() {
        const selected =
            this.panel.querySelector(".custom-select-option.is-selected:not(:disabled)") ||
            this.panel.querySelector(".custom-select-option:not(:disabled)");

        selected?.focus();
    }

    choose(value) {
        if (this.select.value === value) {
            this.close();
            return;
        }

        this.select.value = value;
        this.select.dispatchEvent(new Event("change", { bubbles: true }));
        this.close();
        this.button.focus();
    }

    open() {
        if (this.select.disabled) {
            return;
        }

        if (openedInstance && openedInstance !== this) {
            openedInstance.close();
        }

        openedInstance = this;
        this.panel.hidden = false;
        this.root.classList.add("is-open");
        this.button.setAttribute("aria-expanded", "true");
    }

    close() {
        if (openedInstance === this) {
            openedInstance = null;
        }

        this.panel.hidden = true;
        this.root.classList.remove("is-open");
        this.button.setAttribute("aria-expanded", "false");
    }

    toggle() {
        if (this.root.classList.contains("is-open")) {
            this.close();
        } else {
            this.open();
        }
    }
}

function bindGlobalHandlers() {
    if (globalHandlersBound) {
        return;
    }

    globalHandlersBound = true;

    document.addEventListener("click", (event) => {
        if (!openedInstance) {
            return;
        }

        if (openedInstance.root.contains(event.target)) {
            return;
        }

        openedInstance.close();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && openedInstance) {
            openedInstance.close();
        }
    });
}

export function initCustomSelects(root = document) {
    bindGlobalHandlers();

    const selects = [
        ...root.querySelectorAll(".form-select"),
        ...root.querySelectorAll("#library-filter-select"),
    ];

    for (const select of selects) {
        if (instances.has(select)) {
            continue;
        }

        const instance = new CustomSelect(select);
        instances.set(select, instance);
    }
}

export function refreshCustomSelect(select) {
    const instance = instances.get(select);
    if (!instance) {
        return;
    }

    instance.renderOptions();
    instance.syncFromNative();
}

export function refreshAllCustomSelects(root = document) {
    const selects = [
        ...root.querySelectorAll(".form-select"),
        ...root.querySelectorAll("#library-filter-select"),
    ];

    for (const select of selects) {
        refreshCustomSelect(select);
    }
}