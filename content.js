chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.action !== "detectInputs") return;

    const elements = document.querySelectorAll("input, textarea, select");

    const detectedFields = [];

    elements.forEach((element) => {

        // Skip useless input types
        if (
            element.tagName === "INPUT" &&
            [
                "hidden",
                "submit",
                "button",
                "reset",
                "file",
                "image"
            ].includes(element.type)
        ) {
            return;
        }

        // Try to find associated label
        let label = "";

        if (element.labels && element.labels.length > 0) {
            label = element.labels[0].innerText.trim();
        }

        const field = {
            tag: element.tagName,
            type: element.type || "",
            name: element.name || "",
            id: element.id || "",
            placeholder: element.placeholder || "",
            ariaLabel: element.getAttribute("aria-label") || "",
            label: label
        };

        detectedFields.push(field);
    });

    console.clear();

    console.log("===== DETECTED FIELDS =====");

    detectedFields.forEach((field, index) => {
        console.log(`Field ${index + 1}`);
        console.table(field);
    });

    sendResponse({
        count: detectedFields.length,
        fields: detectedFields
    });

});