/* ========================================
   RAI CUSTOM WEB PAGE JAVASCRIPT
======================================== */


/*
 * Salesforce readiness flag
 */

let raiMessagingReady = false;


/* ========================================
   LANGUAGE TOGGLE  (NEW)
   ----------------------------------------
   This swaps the page's own text (heading, placeholder, quick-action
   labels, status messages) and the text sent for each quick action.

   IMPORTANT LIMITATION: this does NOT change what language RAI (the
   Salesforce bot) replies in mid-session. embeddedservice_bootstrap
   .settings.language is only read once, at init() time (see the inline
   script in index.html), before this toggle can run. If you need the
   bot's own replies to switch language too, that has to be handled on
   the Salesforce side — typically either a second deployment per
   language, or passing a language/session attribute the bot flow reads
   at conversation start. Worth a conversation with whoever owns the
   Agentforce/Messaging setup.
======================================== */

const raiStrings = {

    en: {
        heading: 'How can <span class="brand-name">RAI</span> help?',
        placeholder: "Ask RAI...",
        statusConnecting: "Connecting to RAI...",
        statusReady: "RAI is ready to help.",
        statusOpening: "Opening RAI...",
        statusOpen: "RAI chat is open.",
        statusUnavailable: "RAI is currently unavailable.",
        statusStillConnecting: "RAI is still connecting...",
        statusUnableOpen: "Unable to open RAI chat.",
        quickActions: {
            billing: { label: "Billing & Payments", message: "I need help with billing and payments." },
            maintenance: { label: "Maintenance Requests", message: "I need help with a maintenance request." },
            projectStatus: { label: "Project Status", message: "I would like to check my project status." },
            cancellations: { label: "Cancellations & Changes", message: "I need help with cancelling or changing my project." }
        }
    },

    es: {
        heading: '¿En qué puede ayudarte <span class="brand-name">RAI</span>?',
        placeholder: "Pregúntale a RAI...",
        statusConnecting: "Conectando con RAI...",
        statusReady: "RAI está listo para ayudar.",
        statusOpening: "Abriendo RAI...",
        statusOpen: "El chat de RAI está abierto.",
        statusUnavailable: "RAI no está disponible en este momento.",
        statusStillConnecting: "RAI todavía se está conectando...",
        statusUnableOpen: "No se pudo abrir el chat de RAI.",
        quickActions: {
            billing: { label: "Facturación y Pagos", message: "Necesito ayuda con la facturación y los pagos." },
            maintenance: { label: "Solicitudes de Mantenimiento", message: "Necesito ayuda con una solicitud de mantenimiento." },
            projectStatus: { label: "Estado del Proyecto", message: "Quisiera consultar el estado de mi proyecto." },
            cancellations: { label: "Cancelaciones y Cambios", message: "Necesito ayuda para cancelar o cambiar mi proyecto." }
        }
    }

};


let currentLang = "en";


function applyLang(lang) {

    currentLang = lang;

    const strings = raiStrings[lang];


    const heading = document.getElementById("raiHeading");
    if (heading) {
        heading.innerHTML = strings.heading;
    }


    const input = document.getElementById("raiInput");
    if (input) {
        input.placeholder = strings.placeholder;
    }


    document.querySelectorAll(".quick-button").forEach(function (button) {

        const key = button.dataset.key;
        const action = strings.quickActions[key];

        if (!action) {
            return;
        }

        const label = button.querySelector("span");
        if (label) {
            label.textContent = action.label;
        }

        button.dataset.message = action.message;

    });


    // Only overwrite the status line if it's showing default connecting text —
    // avoid stomping a "ready" / "open" message that's already showing.
    updateRAIStatus(raiMessagingReady ? strings.statusReady : strings.statusConnecting);


    const enBtn = document.getElementById("lang-en");
    const esBtn = document.getElementById("lang-es");

    if (enBtn) enBtn.setAttribute("aria-pressed", String(lang === "en"));
    if (esBtn) esBtn.setAttribute("aria-pressed", String(lang === "es"));

}


document.addEventListener("DOMContentLoaded", function () {

    const enBtn = document.getElementById("lang-en");
    const esBtn = document.getElementById("lang-es");

    if (enBtn) {
        enBtn.addEventListener("click", function () {
            applyLang("en");
        });
    }

    if (esBtn) {
        esBtn.addEventListener("click", function () {
            applyLang("es");
        });
    }

});


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
            raiStrings[currentLang].statusReady
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
            raiStrings[currentLang].statusUnavailable
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
            raiStrings[currentLang].statusStillConnecting
        );

        return Promise.reject(
            "utilAPI unavailable"
        );

    }


    updateRAIStatus(
        raiStrings[currentLang].statusOpening
    );


    return embeddedservice_bootstrap
        .utilAPI
        .launchChat()

        .then(function () {

            console.log(
                "[RAI] Chat opened."
            );

            updateRAIStatus(
                raiStrings[currentLang].statusOpen
            );

        })

        .catch(function (error) {

            console.error(
                "[RAI] Unable to open chat:",
                error
            );

            updateRAIStatus(
                raiStrings[currentLang].statusUnableOpen
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
