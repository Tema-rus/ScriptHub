import { dom } from "../core/dom.js";

export function openSystemMenu() {
    if (!dom.systemMenu || !dom.systemMenuToggle) {
        return;
    }

    dom.systemMenu.hidden = false;
    dom.systemMenuToggle.setAttribute("aria-expanded", "true");
}

export function closeSystemMenu() {
    if (!dom.systemMenu || !dom.systemMenuToggle) {
        return;
    }

    dom.systemMenu.hidden = true;
    dom.systemMenuToggle.setAttribute("aria-expanded", "false");
}

export function toggleSystemMenu() {
    if (!dom.systemMenu) {
        return;
    }

    if (dom.systemMenu.hidden) {
        openSystemMenu();
    } else {
        closeSystemMenu();
    }
}

export function setupSystemMenu() {
    dom.systemMenuToggle?.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleSystemMenu();
    });

    dom.systemMenu?.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("click", () => {
        closeSystemMenu();
    });
}