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


// Disable ask box / quick buttons right away — they get re-enabled once
// "onEmbeddedMessagingReady" fires (see setRAIControlsEnabled below).
document.addEventListener("DOMContentLoaded", function () {
    setRAIControlsEnabled(false);
});


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
        launcherText: "Ask Me Anything",
        contactTitle: "Talk to a person",
        contactHours: "Mon–Fri, 8am–5pm MT",
        quickActions: {
            billing: { label: "Flight Cancellation", message: "I need help with flight cancellation." },
            maintenance: { label: "Baggage Allowance", message: "I need help with baggage allowance." },
            projectStatus: { label: "Hotel Cancellation", message: "I need help with hotel cancellation." },
            cancellations: { label: "Travel Insurance", message: "I need help with travel insurance." }
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
        launcherText: "Pregúntame Lo Que Sea",
        contactTitle: "Habla con una persona",
        contactHours: "Lun–Vie, 8am–5pm MT",
        quickActions: {
            billing: { label: "Cancelación de Vuelo", message: "Necesito ayuda con la cancelación de mi vuelo." },
            maintenance: { label: "Franquicia de Equipaje", message: "Necesito ayuda con la franquicia de equipaje." },
            projectStatus: { label: "Cancelación de Hotel", message: "Necesito ayuda con la cancelación de mi hotel." },
            cancellations: { label: "Seguro de Viaje", message: "Necesito ayuda con el seguro de viaje." }
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

    const launcherText = document.getElementById("rai-launcher-text");
    if (launcherText) {
        launcherText.textContent = strings.launcherText;
    }

    const contactTitle = document.getElementById("rai-contact-title");
    if (contactTitle) {
        contactTitle.textContent = strings.contactTitle;
    }

    const contactHours = document.getElementById("rai-contact-hours");
    if (contactHours) {
        contactHours.textContent = strings.contactHours;
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

        setRAIControlsEnabled(true);

        setRAILoadingVisible(false);

    }
);


/*
 * Update status text
 * Writes into the inner span so the spinner element next to it is
 * never wiped out by textContent overwrites.
 */

function updateRAIStatus(message) {

    const statusText =
        document.getElementById("rai-status-text");

    if (statusText) {

        statusText.textContent = message;

    }

}


/*
 * Loading spinner — visible from page load until RAI reports ready
 * (or fails to load). Gives the customer a clear "still working on
 * it" signal beyond just the status text.
 */

function setRAILoadingVisible(visible) {

    const spinner =
        document.getElementById("rai-status-spinner");

    if (spinner) {

        spinner.style.display = visible ? "inline-block" : "none";

    }

}


/* ========================================
   DISABLE MAIN BODY UNTIL RAI IS READY  (NEW)
   ----------------------------------------
   Salesforce's bootstrap script + init sequence can take a few
   seconds. Until "onEmbeddedMessagingReady" fires, the ask box, send
   button, and quick-reply buttons are all disabled so the user can't
   trigger a launch/send before the widget is actually able to handle
   it. Everything is re-enabled the moment RAI reports ready.
======================================== */

function setRAIControlsEnabled(enabled) {

    const input = document.getElementById("raiInput");
    const send = document.getElementById("sendButton");
    const askBox = document.querySelector(".ask-box");
    const buttons = document.querySelectorAll(".quick-button");

    if (input) {
        input.disabled = !enabled;
    }

    if (send) {
        send.disabled = !enabled;
    }

    if (askBox) {
        askBox.classList.toggle("is-disabled", !enabled);
    }

    buttons.forEach(function (button) {
        button.disabled = !enabled;
    });

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
 * NOTE: The real API is utilAPI.sendTextMessage(text) — a plain
 * string, not utilAPI.sendMessage({ text }). The old code called a
 * method that doesn't exist on utilAPI, which silently threw and
 * meant nothing ever actually reached the bot even though the chat
 * window opened fine.
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
        !embeddedservice_bootstrap.utilAPI ||
        typeof embeddedservice_bootstrap.utilAPI.sendTextMessage !== "function"
    ) {

        console.error(
            "[RAI] sendTextMessage API is unavailable."
        );

        return;
    }


    /*
     * Salesforce Send Message API
     */

    embeddedservice_bootstrap
        .utilAPI
        .sendTextMessage(message)

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
 * A message waiting to be sent once the bot has actually joined the
 * conversation. Salesforce fires "onEmbeddedMessagingFirstBotMessageSent"
 * once the bot is ready to receive user text — that's the reliable
 * signal to send on, not a fixed setTimeout guess.
 */

let pendingMessage = null;


function flushPendingMessage() {

    if (!pendingMessage) {
        return;
    }

    const message = pendingMessage;

    pendingMessage = null;

    sendRAIMessage(message);

}


window.addEventListener(
    "onEmbeddedMessagingFirstBotMessageSent",
    function () {

        console.log(
            "[RAI] Bot has joined the conversation."
        );

        flushPendingMessage();

    }
);


/*
 * Start RAI conversation
 * message is optional — clicking the bare launcher bubble opens the
 * chat with nothing pre-filled.
 */

function startRAIConversation(message) {

    // Was the chat already launched earlier in this session? If so,
    // the bot already joined and "onEmbeddedMessagingFirstBotMessageSent"
    // won't fire again — we need to send directly instead of waiting on it.
    const alreadyOpened = hasOpened;

    if (message) {
        pendingMessage = message;
    }

    /*
     * Open (and maximize) the Salesforce chat.
     */

    openRAIChat()

        .then(function () {

            if (!message) {
                return;
            }

            if (alreadyOpened) {

                // Bot already joined from an earlier launch — give the
                // window a brief moment to re-render, then send directly.
                setTimeout(
                    flushPendingMessage,
                    400
                );

                return;

            }

            // First launch: the event listener above will flush the
            // pending message once the bot actually joins. This safety
            // timeout only fires if that event never arrives for some
            // reason, so the message doesn't get stuck silently.
            setTimeout(
                flushPendingMessage,
                6000
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
