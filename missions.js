
/* =========================================================
   SANDYVERSE — MISSION CONTROL
   12 missions • Local progress saving • No backend
   ========================================================= */

"use strict";

(() => {
    /* ---------- 1. MISSION DATABASE ---------- */

    const MISSIONS = [
        {
            number: 1,
            file: "index.html",
            name: "Secret Agency",
            next: "welcome.html"
        },
        {
            number: 2,
            file: "welcome.html",
            name: "Birthday Welcome",
            next: "episodes.html"
        },
        {
            number: 3,
            file: "episodes.html",
            name: "K-Drama Episode Generator",
            next: "investigation.html"
        },
        {
            number: 4,
            file: "investigation.html",
            name: "Investigation Files",
            next: "courtroom.html"
        },
        {
            number: 5,
            file: "courtroom.html",
            name: "Bias Courtroom",
            next: "quiz.html"
        },
        {
            number: 6,
            file: "quiz.html",
            name: "Birthday Quiz",
            next: "arcade.html"
        },
        {
            number: 7,
            file: "arcade.html",
            name: "Chaos Arcade",
            next: "gift.html"
        },
        {
            number: 8,
            file: "gift.html",
            name: "Digital Gift Reveal",
            next: "vip.html"
        },
        {
            number: 9,
            file: "vip.html",
            name: "VIP Birthday Pass",
            next: "roasts.html"
        },
        {
            number: 10,
            file: "roasts.html",
            name: "Roast Multiverse",
            next: "secret.html"
        },
        {
            number: 11,
            file: "secret.html",
            name: "11:11 Secret Room",
            next: "finale.html"
        },
        {
            number: 12,
            file: "finale.html",
            name: "Birthday Finale",
            next: "index.html"
        }
    ];

    const STORAGE_KEY = "sandyverse-mission-progress-v1";

    const DEFAULT_PROGRESS = {
        highestUnlocked: 1,
        completed: [],
        allComplete: false
    };

    /* ---------- 2. LOAD AND SAVE PROGRESS ---------- */

    function loadProgress() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                return { ...DEFAULT_PROGRESS, completed: [] };
            }

            const parsed = JSON.parse(saved);

            const completed = Array.isArray(parsed.completed)
                ? parsed.completed.filter(number =>
                    Number.isInteger(number) &&
                    number >= 1 &&
                    number <= MISSIONS.length
                )
                : [];

            const highestUnlocked = Number.isInteger(parsed.highestUnlocked)
                ? Math.min(
                    MISSIONS.length,
                    Math.max(1, parsed.highestUnlocked)
                )
                : 1;

            return {
                highestUnlocked,
                completed: [...new Set(completed)].sort((a, b) => a - b),
                allComplete: completed.length === MISSIONS.length
            };
        } catch {
            return { ...DEFAULT_PROGRESS, completed: [] };
        }
    }

    let progress = loadProgress();

    function saveProgress() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(progress)
            );

            return true;
        } catch {
            showStatus(
                "Progress could not be saved. Your browser may be blocking local storage."
            );

            return false;
        }
    }

    /* ---------- 3. FIND THE CURRENT MISSION ---------- */

    function getCurrentFile() {
        const pathname = window.location.pathname;
        const file = pathname.split("/").pop();

        return file || "index.html";
    }

    function getCurrentMission() {
        const file = getCurrentFile();

        return MISSIONS.find(mission => mission.file === file) || null;
    }

    function getMission(number) {
        return MISSIONS.find(mission => mission.number === number) || null;
    }

    /* ---------- 4. STATUS MESSAGES ---------- */

    function showStatus(message) {
        let status =
            document.getElementById("mission-status") ||
            document.getElementById("mission-control-status");

        if (!status) {
            status = document.createElement("p");
            status.id = "mission-control-status";
            status.setAttribute("role", "status");
            status.setAttribute("aria-live", "polite");

            Object.assign(status.style, {
                margin: "12px 0",
                color: "#b9e8ff",
                fontSize: "0.95rem"
            });

            const container =
                document.querySelector("main") ||
                document.body;

            container.appendChild(status);
        }

        status.textContent = message;
    }

    /* ---------- 5. COMPLETE AND UNLOCK ---------- */

    function completeMission(number) {
        const mission = getMission(number);

        if (!mission) {
            showStatus("Mission not found.");
            return false;
        }

        const wasAlreadyCompleted = progress.completed.includes(number);

        if (!wasAlreadyCompleted) {
            progress.completed.push(number);
            progress.completed.sort((a, b) => a - b);
        }

        // Completing a mission unlocks the next one.
        if (number < MISSIONS.length) {
            progress.highestUnlocked = Math.max(
                progress.highestUnlocked,
                number + 1
            );
        }

        progress.allComplete =
            progress.completed.length === MISSIONS.length;

        saveProgress();
        updateMissionUI();

        if (wasAlreadyCompleted) {
            showStatus(`Mission ${number} was already completed. Welcome back, Agent Sandy.`);
        } else if (number === MISSIONS.length) {
            showStatus("ALL 12 MISSIONS COMPLETE. SANDYVERSE MISSION COMPLETE! ✦");
        } else {
            showStatus(
                `MISSION ${String(number).padStart(2, "0")} COMPLETE. ` +
                `Mission ${String(number + 1).padStart(2, "0")} is now unlocked.`
            );
        }

        return true;
    }

    /* ---------- 6. COMPLETE AND MOVE FORWARD ---------- */

    function completeMissionAndGo(number, destination) {
        const mission = getMission(number);

        if (!mission) {
            showStatus("This mission could not be identified.");
            return;
        }

        completeMission(number);

        const expectedDestination =
            destination || mission.next;

        // Only allow navigation to one of our known mission pages.
        const validDestination = MISSIONS.some(
            item => item.file === expectedDestination
        );

        if (!validDestination) {
            showStatus("Navigation destination is not recognised.");
            return;
        }

        window.location.href = expectedDestination;
    }

    // Expose the functions for other JavaScript files.
    window.SANDYVERSE_MISSIONS = MISSIONS;

    window.getSandyverseProgress = () => ({
        highestUnlocked: progress.highestUnlocked,
        completed: [...progress.completed],
        allComplete: progress.allComplete
    });

    window.completeSandyverseMission = completeMission;

    window.completeMissionAndGo = completeMissionAndGo;

    /* ---------- 7. UPDATE MISSION LABELS ---------- */

    function updateMissionUI() {
        const current = getCurrentMission();

        const numberLabel =
            document.getElementById("mission-label") ||
            document.getElementById("current-mission");

        const progressLabel =
            document.getElementById("mission-progress");

        const completedLabel =
            document.getElementById("missions-completed");

        const bar =
            document.getElementById("mission-progress-fill");

        if (current && numberLabel) {
            numberLabel.textContent =
                `MISSION ${String(current.number).padStart(2, "0")} / 12`;
        }

        if (progressLabel) {
            progressLabel.textContent =
                `${progress.completed.length} / ${MISSIONS.length} missions complete`;
        }

        if (completedLabel) {
            completedLabel.textContent =
                String(progress.completed.length);
        }

        if (bar) {
            const percentage =
                (progress.completed.length / MISSIONS.length) * 100;

            bar.style.width = `${percentage}%`;
            bar.setAttribute("role", "progressbar");
            bar.setAttribute("aria-valuemin", "0");
            bar.setAttribute("aria-valuemax", String(MISSIONS.length));
            bar.setAttribute(
                "aria-valuenow",
                String(progress.completed.length)
            );
        }

        // Update mission cards or buttons if the page has them.
        document.querySelectorAll("[data-mission-number]").forEach(element => {
            const number = Number(element.dataset.missionNumber);

            const isCompleted = progress.completed.includes(number);
            const isUnlocked = number <= progress.highestUnlocked;

            element.classList.toggle("mission-completed", isCompleted);
            element.classList.toggle("mission-locked", !isUnlocked);

            if (isCompleted) {
                element.dataset.missionStatus = "completed";
            } else if (isUnlocked) {
                element.dataset.missionStatus = "unlocked";
            } else {
                element.dataset.missionStatus = "locked";
            }

            const status = element.querySelector("[data-mission-status-label]");

            if (status) {
                status.textContent = isCompleted
                    ? "COMPLETED ✓"
                    : isUnlocked
                        ? "UNLOCKED"
                        : "LOCKED 🔒";
            }
        });
    }

    /* ---------- 8. MISSION BUTTONS ---------- */

    function bindButton(selector, missionNumber, destination) {
        document.querySelectorAll(selector).forEach(button => {
            button.addEventListener("click", event => {
                // Avoid submitting a form accidentally.
                if (button.tagName === "BUTTON") {
                    button.type = "button";
                }

                event.preventDefault();
                completeMissionAndGo(missionNumber, destination);
            });
        });
    }

    // Mission 1: Agency homepage → welcome.
    bindButton("#begin-mission", 1, "welcome.html");

    // Mission 2: Birthday welcome → episode generator.
    bindButton("#enter-sandyverse", 2, "episodes.html");

    // Mission 3: Episode generator → investigation.
    bindButton("#continue-episode", 3, "investigation.html");
    bindButton("#finish-episodes", 3, "investigation.html");

    // Mission 4: Investigation → courtroom.
    bindButton("#continue-mission", 4, "courtroom.html");

    // Mission 5: Bias courtroom → quiz.
    bindButton("#continue-court", 5, "quiz.html");

    // Mission 6: Birthday quiz → arcade.
    bindButton("#continue-quiz", 6, "arcade.html");

    // Mission 7: Arcade → digital gift.
    bindButton("#continue-arcade", 7, "gift.html");
    bindButton("#finish-arcade", 7, "gift.html");

    // Mission 8: Gift reveal → VIP pass.
    bindButton("#continue-gift", 8, "vip.html");

    // Mission 9: VIP pass → roast multiverse.
    bindButton("#continue-vip", 9, "roasts.html");

    // Mission 10: Roast multiverse → secret room.
    bindButton("#continue-roasts", 10, "secret.html");

    // Mission 11: Secret room → finale.
    bindButton("#continue-secret", 11, "finale.html");

    // Mission 12 is completed at the end of the birthday finale.
    bindButton("#complete-sandyverse", 12, "finale.html");

    /* ---------- 9. GENERIC MISSION COMPLETION ---------- */

    // Alternative: add data-complete-mission="4"
    // data-next-page="courtroom.html" to a button.
    document.querySelectorAll("[data-complete-mission]").forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();

            const number = Number(button.dataset.completeMission);
            const destination = button.dataset.nextPage;

            if (destination) {
                completeMissionAndGo(number, destination);
            } else {
                completeMission(number);
            }
        });
    });

    /* ---------- 10. FINAL MISSION COMPLETION ---------- */

    function finishFinale() {
        completeMission(12);

        const completeSection =
            document.getElementById("mission-complete") ||
            document.getElementById("mission-complete-section");

        if (completeSection) {
            completeSection.hidden = false;
            completeSection.classList.add("reveal-in");
        }

        const finalMessage =
            document.getElementById("mission-complete-message");

        if (finalMessage) {
            finalMessage.textContent =
                "SANDYVERSE — MISSION COMPLETE ✦ HAPPY BIRTHDAY, SANDY!";
        }
    }

    [
        "#replay-message",
        "#return-home"
    ].forEach(selector => {
        // These buttons are navigation/replay controls, not
        // mission-completion controls.
        // They intentionally do not reset saved progress.
    });

    document.getElementById("finish-final-mission")
        ?.addEventListener("click", finishFinale);

    document.getElementById("mission-complete-button")
        ?.addEventListener("click", finishFinale);

    /* ---------- 11. RESET PROGRESS ---------- */

    // Optional reset button. Include it only if you want a reset
    // control on a page; there is no reset button by default.
    document.getElementById("reset-mission-progress")
        ?.addEventListener("click", () => {
            const confirmed = window.confirm(
                "Reset all SANDYVERSE mission progress? This cannot be undone."
            );

            if (!confirmed) return;

            progress = {
                highestUnlocked: 1,
                completed: [],
                allComplete: false
            };

            saveProgress();
            updateMissionUI();

            showStatus("Mission progress reset. Mission 01 is ready.");
        });

    /* ---------- 12. STARTUP ---------- */

    document.addEventListener("DOMContentLoaded", () => {
        updateMissionUI();

        const current = getCurrentMission();

        if (!current) return;

        if (current.number > progress.highestUnlocked) {
            showStatus(
                `MISSION LOCKED. Complete the earlier missions to unlock ` +
                `${current.name}.`
            );

            // We display a warning rather than forcibly redirecting.
            // This keeps local testing straightforward.
        } else if (progress.completed.includes(current.number)) {
            showStatus(
                `WELCOME BACK, AGENT SANDY. MISSION ${current.number} ` +
                `IS ALREADY COMPLETE.`
            );
        }
    });

    // Some browsers may run this script after DOMContentLoaded.
    if (document.readyState !== "loading") {
        updateMissionUI();
    }
})();
