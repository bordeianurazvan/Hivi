function historyHandler(e) {

    chrome.tabs.create({url: "index.html"});
    window.close();
}

function settingsHandler(e) {

    chrome.tabs.create({url: "settings.html"});
    window.close();
}

    document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('historyButton').addEventListener('click', historyHandler);
    document.getElementById('settingsButton').addEventListener('click', settingsHandler);

});

