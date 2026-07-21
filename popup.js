const button = document.getElementById("detectBtn");

button.addEventListener("click", async () => {

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    chrome.tabs.sendMessage(
        tab.id,
        { action: "detectInputs" },
        (response) => {

            if (chrome.runtime.lastError) {
                alert(chrome.runtime.lastError.message);
                return;
            }

            console.log(response.fields);

            alert(`Found ${response.count} useful field(s)!`);

        }
    );

});