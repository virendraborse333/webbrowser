/* ========================================
   RAI CUSTOM WEB PAGE JAVASCRIPT
======================================== */


/*
 * Salesforce readiness flag
 */

let raiMessagingReady = false;


/*
 * Salesforce Messaging Ready Event
 */

window.addEventListener(
    "onEmbeddedMessagingReady",
    function () {

        console.log(
            "[RAI] Messaging API is ready."
        );

        raiMessagingReady = true;

        updateRAIStatus(
            "RAI is ready to help."
        );

    }
);


/*
 * Update status text
 */

function updateRAIStatus(message) {

    const status =
        document.getElementById("raiStatus");

    if (status) {

        status.textContent = message;

    }

}


/*
 * Open Salesforce RAI Chat
 */

function openRAIChat() {

    if (
        typeof embeddedservice_bootstrap ===
        "undefined"
    ) {

        console.error(
            "[RAI] Embedded Messaging is not loaded."
        );

        updateRAIStatus(
            "RAI is currently unavailable."
        );

        return Promise.reject(
            "Embedded Messaging is not loaded"
        );

    }


    if (
        !embeddedservice_bootstrap.utilAPI
    ) {

        console.error(
            "[RAI] Messaging utilAPI is unavailable."
        );

        updateRAIStatus(
            "RAI is still connecting..."
        );

        return Promise.reject(
            "utilAPI unavailable"
        );

    }


    updateRAIStatus(
        "Opening RAI..."
    );


    return embeddedservice_bootstrap
        .utilAPI
        .launchChat()

        .then(function () {

            console.log(
                "[RAI] Chat opened."
            );

            updateRAIStatus(
                "RAI chat is open."
            );

        })

        .catch(function (error) {

            console.error(
                "[RAI] Unable to open chat:",
                error
            );

            updateRAIStatus(
                "Unable to open RAI chat."
            );

        });

}


/*
 * Send message through Salesforce
 *
 * NOTE:
 * This uses Salesforce's Enhanced Web Chat
 * Send Message API.
 */

function sendRAIMessage(message) {

    if (!message) {
        return;
    }


    if (
        typeof embeddedservice_bootstrap ===
        "undefined"
    ) {

        console.error(
            "[RAI] Embedded Messaging is not loaded."
        );

        return;
    }


    if (
        !embeddedservice_bootstrap.utilAPI
    ) {

        console.error(
            "[RAI] utilAPI is unavailable."
        );

        return;
    }


    /*
     * Salesforce Send Message API
     */

    embeddedservice_bootstrap
        .utilAPI
        .sendMessage({
            text: message
        })

        .then(function () {

            console.log(
                "[RAI] Message sent:",
                message
            );

        })

        .catch(function (error) {

            console.error(
                "[RAI] Message failed:",
                error
            );

        });

}


/*
 * Start RAI conversation
 */

function startRAIConversation(message) {

    if (!message) {
        return;
    }


    /*
     * First open the Salesforce chat.
     */

    openRAIChat()

        .then(function () {

            /*
             * Give the messaging client
             * a short moment to render.
             */

            setTimeout(
                function () {

                    sendRAIMessage(
                        message
                    );

                },
                700
            );

        });

}


/* ========================================
   ASK RAI INPUT
======================================== */

const raiInput =
    document.getElementById(
        "raiInput"
    );

const sendButton =
    document.getElementById(
        "sendButton"
    );


/*
 * Send button
 */

if (sendButton) {

    sendButton.addEventListener(
        "click",
        function () {

            const message =
                raiInput.value.trim();


            if (!message) {

                raiInput.focus();

                return;

            }


            startRAIConversation(
                message
            );


            /*
             * Clear input
             */

            raiInput.value = "";

        }
    );

}


/*
 * Enter key
 */

if (raiInput) {

    raiInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                sendButton.click();

            }

        }
    );

}


/* ========================================
   QUICK REPLY BUTTONS
======================================== */

const quickButtons =
    document.querySelectorAll(
        ".quick-button"
    );


quickButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                const message =
                    button.dataset.message;


                console.log(
                    "[RAI] Quick action:",
                    message
                );


                startRAIConversation(
                    message
                );

            }
        );

    }
);
