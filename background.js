const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const actionAPI = browserAPI === chrome ? chrome.action : browserAPI.browserAction;
actionAPI.onClicked.addListener((tab) => {
    browserAPI.tabs.create({ url: 'wrapped.html' });
});
browserAPI.runtime.onInstalled.addListener(async (details) => {
    browserAPI.tabs.create({ url: 'wrapped.html' });
});