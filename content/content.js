chrome.runtime.onMessage.addListener(

    (request, sender, sendResponse) => {

        if (
            request.action ===
            "detectFields"
        ) {

            const fields =
                detectFields();

            console.table(fields);

            sendResponse({

                count:
                    fields.length,

                fields
            });
        }

        return true;
    }
);