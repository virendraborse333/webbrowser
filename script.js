/* ========================================
   RAI CUSTOM WEB PAGE JAVASCRIPT
======================================== */


/*
 * Salesforce readiness flag
 */

let raiMessagingReady = false;


/*
 * Chat overlay state
 * hasOpened  -> the Salesforce chat has been launched at least once
 * isOpen     -> the fullscreen overlay is currently visible (maximized)
 */

let hasOpened = false;
let isOpen = false;


/* ========================================
   LANGUAGE TOGGLE
   ----------------------------------------
   IMPORTANT LIMITATION: this does NOT change what language RAI (the
   Salesforce bot) replies in mid-session. embeddedservice_bootstrap
   .settings.language is only read once, at init() time (see the inline
   script in index.html), before this toggle can run. If you need the
   bot's own replies to switch language too, that has to be handled on
   the Salesforce side.
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
        chatHeaderTitle: "RAI Assistant",
        minimizeLabel: "Minimize chat",
        launcherLabel: "Open RAI chat",
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
        chatHeaderTitle: "Asistente RAI",
        minimizeLabel: "Minimizar chat",
        launcherLabel: "Abrir el chat de RAI",
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


    const headerTitle = document.querySelector(".rai-chat-header-title");
    if (headerTitle) {
        headerTitle.textContent = strings.chatHeaderTitle;
    }

    const minimizeBtn = document.getElementById("rai-minimize-btn");
    if (minimizeBtn) {
        minimizeBtn.setAttribute("aria-label", strings.minimizeLabel);
        minimizeBtn.setAttribute("title", strings.minimizeLabel);
    }

    const launcher = document.getElementById("rai-launcher");
    if (launcher) {
        launcher.setAttribute("aria-label", strings.launcherLabel);
    }


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


/* ========================================
   FULLSCREEN MAXIMIZE / MINIMIZE  (NEW)
   ----------------------------------------
   The chat container is a position:fixed overlay covering the whole
   viewport. Maximizing/minimizing is purely a CSS toggle — the
   Salesforce widget stays mounted in the DOM the whole time, so the
   conversation state is never lost when the user minimizes.
======================================== */

const chatContainer = document.getElementById("rai-chat-container");
const launcher = document.getElementById("rai-launcher");
const minimizeBtn = document.getElementById("rai-minimize-btn");


function maximizeChat() {

    if (!chatContainer) {
        return;
    }

    chatContainer.classList.add("is-open");
    document.body.classList.add("rai-chat-locked");

    if (launcher) {
        launcher.classList.remove("is-visible");
    }

    isOpen = true;

}


function minimizeChat() {

    if (!chatContainer) {
        return;
    }

    chatContainer.classList.remove("is-open");
    document.body.classList.remove("rai-chat-locked");

    if (launcher && hasOpened) {
        launcher.classList.add("is-visible");
    }

    isOpen = false;

}


if (minimizeBtn) {

    minimizeBtn.addEventListener("click", function () {
        minimizeChat();
    });

}


if (launcher) {

    launcher.addEventListener("click", function () {

        if (hasOpened) {

            // Chat already launched at least once — just re-show it,
            // no need to call openRAIChat() / launchChat() again.
            maximizeChat();

        } else {

            startRAIConversation();

        }

    });

}


// Allow Escape to minimize, like most fullscreen overlays.
document.addEventListener("keydown", function (event) {

    if (event.key === "Escape" && isOpen) {
        minimizeChat();
    }

});


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

    maximizeChat();


    if (hasOpened) {

        // Already launched once — the widget is already mounted,
        // nothing more to do besides having maximized it above.
        updateRAIStatus(
            raiStrings[currentLang].statusOpen
        );

        return Promise.resolve();

    }


    return embeddedservice_bootstrap
        .utilAPI
        .launchChat()

        .then(function () {

            console.log(
                "[RAI] Chat opened."
            );

            hasOpened = true;

            updateRAIStatus(
                raiStrings[currentLang].statusOpen
            );

            // Chat has mounted into #rai-chat-body — hide the
            // "Your conversation will open here" placeholder text.
            const placeholder =
                document.getElementById("rai-chat-placeholder");

            if (placeholder) {
                placeholder.style.display = "none";
            }

        })

        .catch(function (error) {

            console.error(
                "[RAI] Unable to open chat:",
                error
            );

            updateRAIStatus(
                raiStrings[currentLang].statusUnableOpen
            );

            // Launch failed — don't leave an empty fullscreen overlay up.
            minimizeChat();

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
 * message is optional — clicking the bare launcher bubble opens the
 * chat with nothing pre-filled.
 */

function startRAIConversation(message) {

    /*
     * First open (and maximize) the Salesforce chat.
     */

    openRAIChat()

        .then(function () {

            if (!message) {
                return;
            }

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
