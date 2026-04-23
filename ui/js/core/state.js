export let toolsState = [];
export let toastContainer = null;

export const viewState = {
    activeFilter: "all",
    searchQuery: "",
};

export const confirmState = {
    onAccept: null,
};

export const appSettings = {
    autostart: false,
};

export function setToolsState(value) {
    toolsState = Array.isArray(value) ? value : [];
}

export function setToastContainer(value) {
    toastContainer = value;
}