import { dom } from "../core/dom.js";
import { viewState } from "../core/state.js";

let skipBlurClose = false;

export function openSearch() {
    if (!dom.searchToggle) {
        return;
    }

    dom.searchToggle.classList.add("is-open");
    dom.searchToggleButton?.setAttribute("aria-expanded", "true");
    dom.searchToggleButton?.setAttribute("aria-label", "Скрыть поиск");

    requestAnimationFrame(() => dom.searchInput?.focus());
}

export function closeSearch(force = false) {
    if (!dom.searchToggle) {
        return;
    }

    if (!force && dom.searchInput?.value) {
        return;
    }

    dom.searchToggle.classList.remove("is-open");
    dom.searchToggleButton?.setAttribute("aria-expanded", "false");
    dom.searchToggleButton?.setAttribute("aria-label", "Открыть поиск");
}

export function toggleSearch() {
    const isOpen = dom.searchToggle?.classList.contains("is-open");

    if (isOpen) {
        closeSearch(true);
        dom.searchToggleButton?.focus();
    } else {
        openSearch();
    }
}

export function syncSearchFieldState() {
    if (!dom.searchField || !dom.searchInput) {
        return;
    }

    dom.searchField.classList.toggle(
        "has-value",
        Boolean(dom.searchInput.value.trim())
    );
}

export function setupSearch(applyFilters) {
    if (!dom.searchToggleButton || !dom.searchInput) {
        return;
    }

    dom.searchToggleButton.addEventListener("mousedown", () => {
        skipBlurClose = true;
    });

    dom.searchToggleButton.addEventListener("click", () => {
        toggleSearch();

        requestAnimationFrame(() => {
            skipBlurClose = false;
        });
    });

    dom.searchInput.addEventListener("input", (event) => {
        viewState.searchQuery = event.target.value;
        syncSearchFieldState();
        applyFilters();
    });

    dom.searchInput.addEventListener("blur", () => {
        if (skipBlurClose) {
            return;
        }

        closeSearch(false);
    });

    dom.searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (dom.searchInput.value) {
                dom.searchInput.value = "";
                viewState.searchQuery = "";
                syncSearchFieldState();
                applyFilters();
                return;
            }

            closeSearch(true);
            dom.searchToggleButton?.focus();
        }
    });
}