export function setupWindowControls() {
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