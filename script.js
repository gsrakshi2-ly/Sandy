
/* =========================================================
   SANDYVERSE — SHARED INTERACTIONS
   Offline-friendly • No audio • No external libraries
   ========================================================= */

"use strict";

/* ---------- 1. SAFE HELPERS ---------- */

const Sandyverse = (() => {
    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    function setText(selector, text) {
        const element = $(selector);
        if (element) element.textContent = text;
    }

    function show(element) {
        if (!element) return;
        element.hidden = false;
        element.setAttribute("aria-hidden", "false");
    }

    function hide(element) {
        if (!element) return;
        element.hidden = true;
        element.setAttribute("aria-hidden", "true");
    }

    function announce(message, preferredIds = []) {
        for (const id of preferredIds) {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = message;
                element.setAttribute("role", "status");
                return;
            }
        }

        let status = $("#sandyverse-live-status");

        if (!status) {
            status = document.createElement("p");
            status.id = "sandyverse-live-status";
            status.setAttribute("role", "status");
            status.setAttribute("aria-live", "polite");

            Object.assign(status.style, {
                position: "fixed",
                left: "12px",
                bottom: "12px",
                zIndex: "1000",
                maxWidth: "calc(100% - 24px)",
                padding: "12px 16px",
                color: "#f5f8ff",
                background: "#080e20",
                border: "1px solid #65c7ff",
                borderRadius: "10px",
                boxShadow: "0 0 20px rgba(77,157,255,.2)"
            });

            document.body.appendChild(status);
        }

        status.textContent = message;
    }

    function safelyRead(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch {
            return fallback;
        }
    }

    function safelyWrite(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    }

    function navigate(destination) {
        if (!destination) return;
        window.location.href = destination;
    }

    async function copyText(text) {
        if (!text) {
            announce("There is nothing to copy yet.");
            return false;
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const temporary = document.createElement("textarea");
                temporary.value = text;
                temporary.setAttribute("readonly", "");
                temporary.style.position = "fixed";
                temporary.style.opacity = "0";

                document.body.appendChild(temporary);
                temporary.select();

                const copied = document.execCommand("copy");
                temporary.remove();

                if (!copied) throw new Error("Copy unavailable");
            }

            announce("Copied! Your SANDYVERSE keepsake is ready.");
            return true;
        } catch {
            announce("Copy was blocked by your browser. You can select and copy the text manually.");
            return false;
        }
    }

    return {
        $,
        $$,
        setText,
        show,
        hide,
        announce,
        safelyRead,
        safelyWrite,
        navigate,
        copyText
    };
})();

const {
    $,
    $$,
    setText,
    show,
    hide,
    announce,
    safelyRead,
    safelyWrite,
    navigate,
    copyText
} = Sandyverse;


/* ---------- 2. PAGE ENTRY EFFECTS ---------- */

document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("page-ready");

    $$(".panel, .hero-section, .arcade-card").forEach((element, index) => {
        element.style.animationDelay = `${Math.min(index * 65, 390)}ms`;
        element.classList.add("fade-in");
    });

    // Add a starfield only when the page does not already have one.
    if (!$(".star-field")) {
        const stars = document.createElement("div");
        stars.className = "star-field";
        stars.setAttribute("aria-hidden", "true");
        document.body.prepend(stars);
    }

    // Respect the browser's reduced-motion preference.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.documentElement.classList.add("reduced-motion");
    }

    restoreEditableName();
    updateMissionLabel();
});


/* ---------- 3. BASIC PAGE NAVIGATION ---------- */

// The first two pages use buttons rather than link elements.
$("#begin-mission")?.addEventListener("click", () => {
    navigate("welcome.html");
});

$("#enter-sandyverse")?.addEventListener("click", () => {
    navigate("episodes.html");
});

// Any ordinary navigation link can use data-navigate="filename.html".
document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-navigate]");

    if (!trigger) return;

    const destination = trigger.dataset.navigate;

    if (destination) {
        navigate(destination);
    }
});


/* ---------- 4. CONFETTI / CELEBRATION ---------- */

function launchCelebration(amount = 34) {
    const container =
        $("#confetti-container") ||
        $(".celebration-effects") ||
        document.body;

    const reducedMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
        announce("Birthday celebration activated! ✨");
        return;
    }

    const symbols = ["✦", "✧", "★", "✦", "❋"];
    const colours = ["#b9e8ff", "#65c7ff", "#f5f8ff", "#cbd5e8"];

    for (let i = 0; i < Math.min(amount, 60); i++) {
        const particle = document.createElement("span");

        particle.textContent =
            symbols[Math.floor(Math.random() * symbols.length)];

        Object.assign(particle.style, {
            position: "fixed",
            zIndex: "999",
            left: `${Math.random() * 100}vw`,
            top: "-30px",
            color: colours[Math.floor(Math.random() * colours.length)],
            fontSize: `${12 + Math.random() * 18}px`,
            pointerEvents: "none",
            textShadow: "0 0 12px rgba(101,199,255,.8)",
            animation: `sandy-confetti-fall ${2.2 + Math.random() * 2.4}s linear forwards`
        });

        container.appendChild(particle);

        particle.addEventListener("animationend", () => {
            particle.remove();
        }, { once: true });
    }
}

const celebrationStyle = document.createElement("style");
celebrationStyle.textContent = `
@keyframes sandy-confetti-fall {
    0% { transform: translateY(-5vh) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
}
`;
document.head.appendChild(celebrationStyle);

$("#enter-sandyverse")?.addEventListener("click", () => {
    // The page transition takes priority over the celebration.
    // A full celebration can be triggered on the welcome page instead.
});

$("#celebrate-birthday")?.addEventListener("click", () => {
    launchCelebration(45);
});


/* ---------- 5. GENERIC REVEAL CONTROLS ---------- */

// Add data-reveal-target="#element-id" to any button that
// should reveal a hidden section.
document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-reveal-target]");

    if (!trigger) return;

    const target = $(trigger.dataset.revealTarget);

    if (!target) {
        announce("This reveal is not connected yet.");
        return;
    }

    show(target);
    target.classList.add("reveal-in");
    trigger.setAttribute("aria-expanded", "true");
});


/* ---------- 6. GIFT BOX ---------- */

function openGift() {
    const stage =
        $("#gift-stage") ||
        $(".gift-stage");

    const contents =
        $("#gift-contents") ||
        $("#gift-reveal") ||
        $(".gift-contents");

    if (stage) {
        stage.classList.add("opened");
        stage.setAttribute("aria-label", "Birthday gift opened");
    }

    if (contents) {
        show(contents);
        contents.classList.add("reveal-in");
    }

    const button =
        $("#open-gift") ||
        $("#reveal-gift") ||
        $(".gift-open-button");

    if (button) {
        button.setAttribute("aria-expanded", "true");
        button.textContent = "GIFT OPENED ✦";
    }

    launchCelebration(30);
    announce("Birthday gift unlocked! Your keepsakes are ready.");
}

[
    "#open-gift",
    "#reveal-gift",
    ".gift-open-button"
].forEach(selector => {
    $(selector)?.addEventListener("click", openGift);
});


/* ---------- 7. COPY KEEPSAKES ---------- */

document.addEventListener("click", async event => {
    const trigger = event.target.closest("[data-copy-target]");

    if (!trigger) return;

    const target = $(trigger.dataset.copyTarget);

    if (!target) {
        announce("The keepsake text could not be found.");
        return;
    }

    await copyText(target.innerText || target.value || "");
});

$("#copy-certificate")?.addEventListener("click", async () => {
    const certificate =
        $("#agent-certificate") ||
        $("#birthday-certificate") ||
        $(".agent-certificate");

    if (certificate) {
        await copyText(certificate.innerText);
    }
});


/* ---------- 8. VIP PASS: EDITABLE CODENAME ---------- */

function restoreEditableName() {
    const nameInput =
        $("#vip-name") ||
        $("#agent-name") ||
        $("#pass-name");

    const codenameInput =
        $("#vip-codename") ||
        $("#agent-codename") ||
        $("#pass-codename");

    const storedName = safelyRead("sandyverse-vip-name");
    const storedCodename = safelyRead("sandyverse-vip-codename");

    if (nameInput && storedName) {
        nameInput.value = storedName;
    }

    if (codenameInput && storedCodename) {
        codenameInput.value = storedCodename;
    }

    updateVipPass();
}

function updateVipPass() {
    const nameInput =
        $("#vip-name") ||
        $("#agent-name") ||
        $("#pass-name");

    const codenameInput =
        $("#vip-codename") ||
        $("#agent-codename") ||
        $("#pass-codename");

    const name = nameInput?.value.trim() || "Sandra Mattew";
    const codename = codenameInput?.value.trim() || "SANDY";

    [
        "#vip-display-name",
        "#pass-display-name",
        "#certificate-display-name"
    ].forEach(selector => setText(selector, name));

    [
        "#vip-display-codename",
        "#pass-display-codename",
        "#certificate-display-codename"
    ].forEach(selector => setText(selector, codename));

    safelyWrite("sandyverse-vip-name", name);
    safelyWrite("sandyverse-vip-codename", codename);
}

[
    "#vip-name",
    "#agent-name",
    "#pass-name",
    "#vip-codename",
    "#agent-codename",
    "#pass-codename"
].forEach(selector => {
    $(selector)?.addEventListener("input", updateVipPass);
});

[
    "#save-vip-pass",
    "#update-vip-pass",
    "#generate-vip-pass"
].forEach(selector => {
    $(selector)?.addEventListener("click", () => {
        updateVipPass();
        announce("VIP pass updated. Take a screenshot to keep it!");
    });
});

[
    "#copy-vip-pass",
    "#copy-pass"
].forEach(selector => {
    $(selector)?.addEventListener("click", async () => {
        const pass = $("#vip-pass") || $(".vip-pass");

        if (pass) await copyText(pass.innerText);
    });
});


/* ---------- 9. ROAST MULTIVERSE ---------- */

// The roast lines stay in roasts.html or its own data file.
// This controller cycles through the text already present on
// the page, so it does not overwrite your chosen roast wording.

let roastIndex = 0;

function getRoastFiles() {
    return $$(".roast-text, [data-roast]");
}

function showRoast(index) {
    const roasts = getRoastFiles();

    if (!roasts.length) {
        announce("Roast files are still being assembled.");
        return;
    }

    roastIndex = (index + roasts.length) % roasts.length;

    roasts.forEach((roast, i) => {
        const active = i === roastIndex;

        if (roast.dataset.roast !== undefined) {
            roast.hidden = !active;
        } else {
            roast.hidden = !active;
        }
    });

    const counter =
        $("#roast-counter-number") ||
        $("#roast-count");

    if (counter) {
        counter.textContent = String(roastIndex + 1);
    }

    const fileNumber = $("#roast-file-number");

    if (fileNumber) {
        fileNumber.textContent =
            `CLASSIFIED FILE ${String(roastIndex + 1).padStart(2, "0")}`;
    }

    const activeRoast = roasts[roastIndex];

    if (activeRoast) {
        activeRoast.classList.add("reveal-in");
    }
}

$("#next-roast")?.addEventListener("click", () => {
    showRoast(roastIndex + 1);
});

$("#roast-me")?.addEventListener("click", () => {
    showRoast(roastIndex);
    announce("ROAST FILE OPENED. Proceed at your own comedic risk.");
});

$("#maximum-chaos")?.addEventListener("click", () => {
    showRoast(Math.floor(Math.random() * Math.max(1, getRoastFiles().length)));
    launchCelebration(14);
});

$("#copy-roast")?.addEventListener("click", async () => {
    const roasts = getRoastFiles();
    const roast = roasts[roastIndex];

    if (roast) await copyText(roast.innerText);
});

$("#agency-reaction")?.addEventListener("click", () => {
    const reactions = [
        "AGENCY ANALYSIS: The roast has been classified as highly accurate.",
        "SYSTEM NOTICE: The investigation team requests a moment of silence for the common sense department.",
        "CONFIDENTIAL REPORT: Sandy has entered the chat. Everyone remain professional.",
        "WARNING: CHAOS LEVEL EXCEEDS THE AGENCY'S ORIGINAL ESTIMATE.",
        "FINAL ASSESSMENT: Evidence reviewed. Dignity temporarily unavailable."
    ];

    const target =
        $("#agency-reaction-text") ||
        $("#roast-reaction") ||
        $(".roast-reaction-panel");

    if (target) {
        target.textContent =
            reactions[Math.floor(Math.random() * reactions.length)];

        target.classList.remove("reveal-in");
        void target.offsetWidth;
        target.classList.add("reveal-in");
    }
});

// Category filters can use data-roast-category="kpop",
// "kdrama", "ramen", "ultimate", or "mixed".
$$("[data-roast-category-filter]").forEach(button => {
    button.addEventListener("click", () => {
        const category = button.dataset.roastCategoryFilter;

        $$("[data-roast-category-filter]").forEach(other => {
            other.classList.toggle("active", other === button);
        });

        const allRoasts = getRoastFiles();
        const matching = allRoasts.filter(roast =>
            category === "mixed" ||
            !category ||
            roast.dataset.category === category
        );

        allRoasts.forEach(roast => {
            roast.hidden = !matching.includes(roast);
        });

        roastIndex = 0;

        if (matching.length) {
            matching[0].hidden = false;
            matching[0].classList.add("reveal-in");
        }

        announce(
            matching.length
                ? `${matching.length} roast file(s) available.`
                : "No roast files in this category yet."
        );
    });
});

document.addEventListener("DOMContentLoaded", () => {
    if (getRoastFiles().length) showRoast(0);
});


/* ---------- 10. SECRET ROOM CODE ---------- */

// The correct code can be set directly in HTML with:
// data-secret-code="1111" on the secret-room container.
// Default code: 1111 (the 11:11 clue).

function checkSecretCode() {
    const input =
        $("#secret-code") ||
        $("#secret-code-input") ||
        $("#observatory-code");

    const room =
        $("#secret-room") ||
        $(".secret-room") ||
        $(".secret-code-section");

    const correctCode =
        room?.dataset.secretCode ||
        document.body.dataset.secretCode ||
        "1111";

    if (!input) {
        announce("Enter the secret code to continue.");
        return;
    }

    if (input.value.trim().toUpperCase() === correctCode.toUpperCase()) {
        const unlocked =
            $("#secret-unlocked") ||
            $("#secret-envelope-section") ||
            $("#secret-message-section");

        if (unlocked) show(unlocked);

        room?.classList.add("secret-unlocked");
        input.setAttribute("aria-invalid", "false");

        const codeForm = $("#secret-code-form");

        if (codeForm) hide(codeForm);

        announce("ACCESS GRANTED. The secret envelope is now available.");

        const envelope =
            $("#secret-envelope") ||
            $(".secret-envelope");

        if (envelope) {
            envelope.classList.add("reveal-in");
        }
    } else {
        input.setAttribute("aria-invalid", "true");
        input.classList.remove("shake");
        void input.offsetWidth;
        input.classList.add("shake");

        announce("ACCESS DENIED. Check the clue and try again.");
    }
}

$("#check-secret-code")?.addEventListener("click", checkSecretCode);

$("#secret-code-form")?.addEventListener("submit", event => {
    event.preventDefault();
    checkSecretCode();
});


/* ---------- 11. ENVELOPE OPENING ---------- */

function toggleEnvelope(envelope, messageSection) {
    if (!envelope) return;

    const isOpen = envelope.classList.toggle("opened");

    envelope.setAttribute("aria-expanded", String(isOpen));

    if (isOpen && messageSection) {
        show(messageSection);
        messageSection.classList.add("reveal-in");
    }

    if (isOpen) {
        launchCelebration(24);
        announce("Envelope opened. Your message is waiting.");
    }
}

[
    "#open-secret-envelope",
    "#secret-envelope",
    ".secret-envelope"
].forEach(selector => {
    $(selector)?.addEventListener("click", event => {
        // Prevent duplicate handling if the same element matches
        // multiple selectors.
        if (event.currentTarget.dataset.envelopeHandled) return;
        event.currentTarget.dataset.envelopeHandled = "true";

        const envelope = event.currentTarget;
        const message =
            $("#secret-message-section") ||
            $("#secret-letter-content") ||
            $(".secret-message-section");

        toggleEnvelope(envelope, message);
    });
});

[
    "#open-final-letter",
    "#final-letter-envelope",
    ".final-letter-envelope"
].forEach(selector => {
    $(selector)?.addEventListener("click", event => {
        if (event.currentTarget.dataset.envelopeHandled) return;
        event.currentTarget.dataset.envelopeHandled = "true";

        const envelope = event.currentTarget;
        const content =
            $("#final-letter-content") ||
            $("#final-letter-paragraphs") ||
            $(".final-letter-content");

        toggleEnvelope(envelope, content);
    });
});


/* ---------- 12. FINALE: PARAGRAPH-BY-PARAGRAPH LETTER ---------- */

// Put each paragraph in an element with class
// "final-letter-paragraph". The first is revealed when the
// OPEN YOUR LETTER button is pressed. CONTINUE reveals the next.

let currentLetterParagraph = -1;

function getLetterParagraphs() {
    return $$(".final-letter-paragraph");
}

function revealNextLetterParagraph() {
    const paragraphs = getLetterParagraphs();

    if (!paragraphs.length) {
        announce("The birthday letter text has not been added yet.");
        return;
    }

    if (currentLetterParagraph === -1) {
        currentLetterParagraph = 0;

        paragraphs.forEach((paragraph, index) => {
            paragraph.hidden = index !== 0;
        });

        const content =
            $("#final-letter-content") ||
            $("#final-letter-paragraphs") ||
            $(".final-letter-content");

        if (content) show(content);

        const continueButton =
            $("#continue-letter") ||
            $("#next-letter-paragraph");

        if (continueButton) show(continueButton);

        announce("Your birthday letter begins here.");
        return;
    }

    if (currentLetterParagraph < paragraphs.length - 1) {
        currentLetterParagraph++;
        const paragraph = paragraphs[currentLetterParagraph];

        show(paragraph);
        paragraph.classList.add("reveal-in");

        announce(
            `Letter paragraph ${currentLetterParagraph + 1} of ${paragraphs.length}.`
        );
    }

    if (currentLetterParagraph >= paragraphs.length - 1) {
        const continueButton =
            $("#continue-letter") ||
            $("#next-letter-paragraph");

        if (continueButton) hide(continueButton);

        const signoff =
            $("#final-signoff") ||
            $(".final-signoff");

        if (signoff) {
            show(signoff);
            signoff.classList.add("reveal-in");
        }

        launchCelebration(35);

        const complete =
            $("#mission-complete") ||
            $("#mission-complete-section") ||
            $(".mission-complete-section");

        if (complete) {
            show(complete);
            complete.classList.add("reveal-in");
        }

        announce("All paragraphs revealed. SANDYVERSE MISSION COMPLETE.");
    }
}

[
    "#open-your-letter",
    "#open-final-letter-message",
    "#start-letter"
].forEach(selector => {
    $(selector)?.addEventListener("click", revealNextLetterParagraph);
});

[
    "#continue-letter",
    "#next-letter-paragraph"
].forEach(selector => {
    $(selector)?.addEventListener("click", revealNextLetterParagraph);
});


/* ---------- 13. FINAL REPLAY ---------- */

$("#replay-message")?.addEventListener("click", () => {
    currentLetterParagraph = -1;

    getLetterParagraphs().forEach(paragraph => hide(paragraph));

    hide($("#final-signoff"));
    hide($(".final-signoff"));
    hide($("#mission-complete"));
    hide($("#mission-complete-section"));
    hide($(".mission-complete-section"));

    const envelope =
        $("#final-letter-envelope") ||
        $(".final-letter-envelope");

    if (envelope) {
        envelope.classList.remove("opened");
        delete envelope.dataset.envelopeHandled;
        envelope.setAttribute("aria-expanded", "false");
    }

    const content =
        $("#final-letter-content") ||
        $("#final-letter-paragraphs") ||
        $(".final-letter-content");

    if (content) hide(content);

    const openButton =
        $("#open-your-letter") ||
        $("#open-final-letter-message") ||
        $("#start-letter");

    if (openButton) show(openButton);

    announce("The birthday letter is ready to be read again.");
});

$("#return-home")?.addEventListener("click", () => {
    navigate("index.html");
});


/* ---------- 14. MISSION LABEL ---------- */

function updateMissionLabel() {
    const missionLabel =
        $("#mission-label") ||
        $("#current-mission") ||
        $(".current-mission");

    if (!missionLabel) return;

    const page = window.location.pathname.split("/").pop();

    const missions = {
        "index.html": "MISSION 01 / 12",
        "welcome.html": "MISSION 02 / 12",
        "episodes.html": "MISSION 03 / 12",
        "investigation.html": "MISSION 04 / 12",
        "courtroom.html": "MISSION 05 / 12",
        "quiz.html": "MISSION 06 / 12",
        "arcade.html": "MISSION 07 / 12",
        "gift.html": "MISSION 08 / 12",
        "vip.html": "MISSION 09 / 12",
        "roasts.html": "MISSION 10 / 12",
        "secret.html": "MISSION 11 / 12",
        "finale.html": "MISSION 12 / 12"
    };

    missionLabel.textContent = missions[page] || "SANDYVERSE";
}


/* ---------- 15. PRINT / SAVE A KEEPSAKE ---------- */

document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-print-target]");

    if (!trigger) return;

    const selector = trigger.dataset.printTarget;
    const target = $(selector);

    if (!target) {
        announce("The keepsake could not be found.");
        return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        announce("Your browser blocked the print window. Try the browser's screenshot feature instead.");
        return;
    }

    const safeContent = target.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>SANDYVERSE Keepsake</title>
            <style>
                body {
                    margin: 24px;
                    font-family: Arial, sans-serif;
                    color: #f5f8ff;
                    background: #050816;
                }
                .keepsake {
                    max-width: 800px;
                    margin: auto;
                    padding: 28px;
                    border: 2px solid #b9e8ff;
                    background: #080e20;
                }
                h1, h2, h3 { color: #b9e8ff; }
                p { line-height: 1.8; }
                @media print {
                    body {
                        margin: 0;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    .keepsake { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <main class="keepsake">${safeContent}</main>
            <script>
                window.addEventListener("load", () => window.print());
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
});


/* ---------- 16. FRIENDLY ERROR HANDLING ---------- */

// If a button has a data-action attribute, this handler provides
// a helpful message when that action has not been connected yet.
// It deliberately does not override the known working actions.

document.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;

    const knownActions = [
        "begin-mission",
        "enter-sandyverse",
        "open-gift",
        "reveal-gift",
        "roast-me",
        "next-roast",
        "maximum-chaos",
        "copy-roast",
        "agency-reaction",
        "check-secret-code",
        "open-your-letter",
        "continue-letter",
        "replay-message",
        "return-home"
    ];

    if (!knownActions.includes(action)) {
        announce("This feature will be connected as the remaining mission files are completed.");
    }
});
