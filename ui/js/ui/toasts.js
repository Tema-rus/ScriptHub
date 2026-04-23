import {toastContainer, setToastContainer} from "../core/state.js";
import {escapeHtml} from "../core/utils.js";

function ensureToastContainer() {
    if (toastContainer) {
        return toastContainer;
    }

    const container = document.createElement("div");
    container.className = "toast-container";
    container.id = "toast-container";
    document.body.appendChild(container);
    setToastContainer(container);

    return container;
}

function getToastIcon(type) {
    if (type === "success") {
        return `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6.5 12.5L10 16L17.5 8.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        `;
    }

    if (type === "error") {
        return `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 8V13" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"></path>
                <circle cx="12" cy="16.5" r="1" fill="currentColor"></circle>
                <path d="M10.3 4.8L3.9 16.2C3.2 17.4 4.1 19 5.5 19H18.5C19.9 19 20.8 17.4 20.1 16.2L13.7 4.8C13 3.6 11 3.6 10.3 4.8Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path>
            </svg>
        `;
    }

    return `
        <svg class="toast-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"></circle>
            <path d="M12 10V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
            <circle cx="12" cy="7.5" r="1" fill="currentColor"></circle>
        </svg>
    `;
}

function removeToast(toast) {
    if (!toast || toast.dataset.removing === "true") {
        return;
    }

    toast.dataset.removing = "true";
    toast.classList.remove("is-visible");
    toast.classList.add("is-removing");

    setTimeout(() => {
        toast.remove();
    }, 180);
}

export function showToast({
                              title = "Уведомление",
                              message = "",
                              type = "info",
                              duration = 3200,
                          } = {}) {
    const container = ensureToastContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;

    toast.innerHTML = `
        ${getToastIcon(type)}

        <div class="toast-body">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>

        <button class="toast-close" type="button" aria-label="Закрыть уведомление">
            <svg class="icon-close" viewBox="0 0 24 24" fill="none">
                <path d="M8 8L16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                <path d="M16 8L8 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
            </svg>
        </button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("is-visible");
    });

    const timeoutId = setTimeout(() => {
        removeToast(toast);
    }, duration);

    toast.querySelector(".toast-close")?.addEventListener("click", () => {
        clearTimeout(timeoutId);
        removeToast(toast);
    });

    return toast;
}