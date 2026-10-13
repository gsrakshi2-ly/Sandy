
/* =========================================================
   SANDYVERSE — CHAOS ARCADE
   Offline mini-games • Score tracking • No audio
   ========================================================= */

"use strict";

(() => {
    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    const arcade = {
        score: 0,
        gamesPlayed: 0,
        bestScore: 0,
        activeGame: null,
        cleanup: [],
        round: 0,
        running: false
    };

    /* ---------- 1. SHARED HELPERS ---------- */

    function announce(message) {
        const status =
            $("#game-status") ||
            $("#arcade-status") ||
            $("#game-message");

        if (status) {
            status.textContent = message;
            status.setAttribute("role", "status");
            status.setAttribute("aria-live", "polite");
        }
    }

    function readNumber(key, fallback = 0) {
        try {
            const value = Number(localStorage.getItem(key));
            return Number.isFinite(value) ? value : fallback;
        } catch {
            return fallback;
        }
    }

    function saveNumber(key, value) {
        try {
            localStorage.setItem(key, String(value));
        } catch {
            // The game remains playable if local storage is blocked.
        }
    }

    function getPlayfield() {
        return (
            $("#game-playfield") ||
            $("#arcade-playfield") ||
            $(".game-playfield")
        );
    }

    function getOverlay() {
        return (
            $("#game-start-overlay") ||
            $("#arcade-start-overlay") ||
            $(".game-start-overlay")
        );
    }

    function getScoreElement() {
        return $("#game-score") || $("#arcade-score");
    }

    function updateScore(points) {
        arcade.score += points;

        const element = getScoreElement();

        if (element) {
            element.textContent = String(arcade.score);
        }

        const scoreLabels = $$(".current-game-score");

        scoreLabels.forEach(label => {
            label.textContent = String(arcade.score);
        });
    }

    function clearGame() {
        arcade.running = false;

        arcade.cleanup.forEach(cleanup => {
            try {
                cleanup();
            } catch {
                // Continue cleaning up other handlers.
            }
        });

        arcade.cleanup = [];

        const field = getPlayfield();

        if (field) {
            field.replaceChildren();
        }
    }

    function addCleanup(callback) {
        arcade.cleanup.push(callback);
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;

        return element;
    }

    function showGameResult(title, message) {
        const field = getPlayfield();

        if (!field) {
            announce(`${title} — ${message}`);
            return;
        }

        field.replaceChildren();

        const result = makeElement("section", "game-result-panel");
        const heading = makeElement("h3", "", title);
        const description = makeElement("p", "", message);

        result.append(heading, description);

        const score = makeElement(
            "p",
            "game-result-score",
            `FINAL SCORE: ${arcade.score}`
        );

        result.appendChild(score);

        const replay = makeElement(
            "button",
            "game-replay-button",
            "PLAY AGAIN ↻"
        );

        replay.type = "button";
        replay.addEventListener("click", () => {
            if (arcade.activeGame) {
                startGame(arcade.activeGame);
            }
        });

        result.appendChild(replay);
        field.appendChild(result);

        announce(`${title}. ${message}`);
    }

    function finishGame(title, message) {
        if (!arcade.running) return;

        arcade.running = false;
        arcade.gamesPlayed++;

        const previousBest = readNumber("sandyverse-arcade-best", 0);

        arcade.bestScore = Math.max(previousBest, arcade.score);
        saveNumber("sandyverse-arcade-best", arcade.bestScore);

        saveNumber("sandyverse-arcade-played", arcade.gamesPlayed);

        const bestLabel =
            $("#arcade-best-score") ||
            $("#game-best-score");

        if (bestLabel) {
            bestLabel.textContent = String(arcade.bestScore);
        }

        const playedLabel = $("#arcade-games-played");

        if (playedLabel) {
            playedLabel.textContent = String(
                readNumber("sandyverse-arcade-played", arcade.gamesPlayed)
            );
        }

        showGameResult(title, message);
    }

    function startGame(gameName) {
        const field = getPlayfield();

        if (!field) {
            announce(
                "Arcade playfield not found. Check that your HTML contains an element with id=\"game-playfield\"."
            );
            return;
        }

        clearGame();

        arcade.activeGame = gameName;
        arcade.score = 0;
        arcade.round = 0;
        arcade.running = true;

        updateScoreDisplay();

        const overlay = getOverlay();

        if (overlay) {
            overlay.hidden = true;
        }

        const title = $("#active-game-title");

        if (title) {
            title.textContent = gameTitles[gameName] || "CHAOS ARCADE";
        }

        const games = {
            stars: playStarTap,
            memory: playMemoryCode,
            reaction: playReactionTest
        };

        const game = games[gameName];

        if (!game) {
            arcade.running = false;
            announce("Unknown game. Choose one of the available arcade missions.");
            return;
        }

        game(field);
    }

    function updateScoreDisplay() {
        const element = getScoreElement();

        if (element) element.textContent = "0";

        const bestLabel =
            $("#arcade-best-score") ||
            $("#game-best-score");

        if (bestLabel) {
            bestLabel.textContent = String(
                readNumber("sandyverse-arcade-best", 0)
            );
        }
    }

    const gameTitles = {
        stars: "TAP THE STARS",
        memory: "MEMORISE THE CHAOS",
        reaction: "AGENT REFLEX TEST"
    };


    /* ---------- 2. GAME ONE: TAP THE STARS ---------- */

    function playStarTap(field) {
        let remaining = 20;
        let targetCount = 0;
        let timerId = null;

        const heading = makeElement("h3", "game-instruction");
        heading.textContent = "Tap as many stars as you can in 20 seconds.";

        const timer = makeElement("p", "game-timer", "TIME: 20");
        timer.id = "star-game-timer";

        const target = makeElement("button", "star-target", "✦");
        target.type = "button";
        target.setAttribute("aria-label", "Tap the star");

        const counter = makeElement(
            "p",
            "game-instruction",
            "STARS CAUGHT: 0"
        );

        field.append(heading, timer, target, counter);

        function moveTarget() {
            const maxX = Math.max(0, field.clientWidth - 100);
            const maxY = Math.max(0, field.clientHeight - 100);

            target.style.position = "absolute";
            target.style.left = `${Math.random() * maxX}px`;
            target.style.top = `${Math.random() * maxY}px`;
        }

        field.style.position = "relative";
        field.style.minHeight = "250px";

        moveTarget();

        target.addEventListener("click", () => {
            if (!arcade.running) return;

            targetCount++;
            updateScore(10);

            counter.textContent = `STARS CAUGHT: ${targetCount}`;

            target.textContent = ["✦", "★", "✧", "✦"][
                Math.floor(Math.random() * 4)
            ];

            moveTarget();
        });

        timerId = window.setInterval(() => {
            remaining--;
            timer.textContent = `TIME: ${remaining}`;

            if (remaining <= 0) {
                window.clearInterval(timerId);

                finishGame(
                    "STAR HUNTER COMPLETE ✦",
                    targetCount >= 15
                        ? "AGENT SANDY HAS EXCELLENT REFLEXES."
                        : targetCount >= 8
                            ? "SOLID WORK. THE STARS PUT UP A FIGHT."
                            : "THE STARS WON THIS ROUND. REQUESTING A REMATCH."
                );
            }
        }, 1000);

        addCleanup(() => {
            window.clearInterval(timerId);
            field.style.minHeight = "";
            field.style.position = "";
        });
    }


    /* ---------- 3. GAME TWO: MEMORISE THE CHAOS ---------- */

    function playMemoryCode(field) {
        const symbols = ["☾", "✦", "★", "◇", "✧", "♢"];
        let sequence = [];
        let playerIndex = 0;
        let acceptingInput = false;
        let level = 1;
        let sequenceTimeouts = [];

        const heading = makeElement(
            "h3",
            "game-instruction",
            "Memorise the symbols. Repeat the sequence in order."
        );

        const levelLabel = makeElement(
            "p",
            "memory-level",
            "LEVEL 1"
        );

        const display = makeElement(
            "div",
            "memory-sequence-display",
            "READY, AGENT?"
        );

        display.setAttribute("aria-live", "polite");

        const grid = makeElement("div", "memory-button-grid");

        field.append(heading, levelLabel, display, grid);

        const buttons = symbols.map(symbol => {
            const button = makeElement(
                "button",
                "memory-symbol-button",
                symbol
            );

            button.type = "button";
            button.dataset.symbol = symbol;
            button.setAttribute("aria-label", `Symbol ${symbol}`);
            grid.appendChild(button);

            button.addEventListener("click", () => {
                if (!arcade.running || !acceptingInput) return;

                const expected = sequence[playerIndex];

                if (symbol !== expected) {
                    acceptingInput = false;

                    finishGame(
                        "MEMORY FILE CORRUPTED",
                        `You reached level ${level}. The agency recommends a rematch.`
                    );

                    return;
                }

                playerIndex++;
                updateScore(5);

                if (playerIndex === sequence.length) {
                    acceptingInput = false;

                    display.textContent = "CORRECT! ✦";
                    level++;

                    if (level > 6) {
                        finishGame(
                            "MEMORY MASTER",
                            "You completed all six levels. The agency is impressed."
                        );
                        return;
                    }

                    const timeout = window.setTimeout(() => {
                        if (arcade.running) nextRound();
                    }, 850);

                    sequenceTimeouts.push(timeout);
                }
            });
        });

        function nextRound() {
            if (!arcade.running) return;

            playerIndex = 0;
            sequence = [];

            for (let i = 0; i < level + 1; i++) {
                sequence.push(
                    symbols[Math.floor(Math.random() * symbols.length)]
                );
            }

            levelLabel.textContent = `LEVEL ${level}`;
            display.textContent = "WATCH CAREFULLY...";

            acceptingInput = false;

            sequence.forEach((symbol, index) => {
                const timeout = window.setTimeout(() => {
                    if (!arcade.running) return;

                    display.textContent = symbol;
                }, index * 650 + 500);

                sequenceTimeouts.push(timeout);
            });

            const finishTimeout = window.setTimeout(() => {
                if (!arcade.running) return;

                display.textContent = "YOUR TURN!";
                acceptingInput = true;
            }, sequence.length * 650 + 600);

            sequenceTimeouts.push(finishTimeout);
        }

        nextRound();

        addCleanup(() => {
            sequenceTimeouts.forEach(timeout => window.clearTimeout(timeout));
            acceptingInput = false;
        });
    }


    /* ---------- 4. GAME THREE: AGENT REFLEX TEST ---------- */

    function playReactionTest(field) {
        const instructions = makeElement(
            "p",
            "game-instruction",
            "Wait for the panel to turn blue, then click as quickly as you can."
        );

        const panel = makeElement(
            "button",
            "reaction-panel",
            "CLICK TO BEGIN"
        );

        panel.type = "button";

        const result = makeElement(
            "p",
            "reaction-result",
            "FALSE STARTS WILL COST YOU A ROUND."
        );

        field.append(instructions, panel, result);

        let phase = "ready";
        let startTime = 0;
        let timeoutId = null;
        let round = 0;
        let totalMilliseconds = 0;
        let falseStarts = 0;

        function beginRound() {
            if (!arcade.running) return;

            phase = "waiting";
            panel.textContent = "WAIT...";
            panel.classList.remove("reaction-go");

            const delay = 1200 + Math.random() * 2500;

            timeoutId = window.setTimeout(() => {
                if (!arcade.running) return;

                phase = "go";
                startTime = performance.now();

                panel.textContent = "CLICK NOW!";
                panel.classList.add("reaction-go");
            }, delay);
        }

        panel.addEventListener("click", () => {
            if (!arcade.running) return;

            if (phase === "ready") {
                round = 0;
                totalMilliseconds = 0;
                falseStarts = 0;
                beginRound();
                return;
            }

            if (phase === "waiting") {
                window.clearTimeout(timeoutId);
                falseStarts++;
                phase = "ready";

                panel.textContent = "TOO EARLY!";
                result.textContent = "Wait until the panel turns blue.";

                const resetTimeout = window.setTimeout(() => {
                    if (!arcade.running) return;

                    panel.textContent = "TRY AGAIN";
                    phase = "ready";
                }, 850);

                addCleanup(() => window.clearTimeout(resetTimeout));
                return;
            }

            if (phase === "go") {
                const elapsed = Math.round(performance.now() - startTime);

                totalMilliseconds += elapsed;
                round++;

                const points = Math.max(
                    10,
                    100 - Math.floor(elapsed / 5)
                );

                updateScore(points);

                result.textContent =
                    `REACTION TIME: ${elapsed} ms | ROUND ${round}/3`;

                panel.classList.remove("reaction-go");

                if (round >= 3) {
                    const average = Math.round(totalMilliseconds / 3);

                    finishGame(
                        "REFLEX TEST COMPLETE",
                        `Average reaction: ${average} ms. ` +
                        (falseStarts
                            ? `False starts: ${falseStarts}. Stay focused, Agent.`
                            : "Perfect patience. The agency approves.")
                    );

                    return;
                }

                phase = "ready";
                panel.textContent = "NEXT ROUND";

                const nextTimeout = window.setTimeout(() => {
                    if (arcade.running) beginRound();
                }, 900);

                addCleanup(() => window.clearTimeout(nextTimeout));
            }
        });

        addCleanup(() => {
            window.clearTimeout(timeoutId);
            panel.classList.remove("reaction-go");
        });
    }


    /* ---------- 5. GAME SELECTION ---------- */

    function connectGameButtons() {
        $$("[data-game]").forEach(button => {
            button.addEventListener("click", () => {
                const gameName = button.dataset.game;

                if (gameTitles[gameName]) {
                    startGame(gameName);
                } else {
                    announce("That game has not been configured yet.");
                }
            });
        });

        // Alternative individual button IDs.
        const buttonMap = {
            "#play-stars": "stars",
            "#play-memory": "memory",
            "#play-reaction": "reaction",
            "#start-star-game": "stars",
            "#start-memory-game": "memory",
            "#start-reaction-game": "reaction"
        };

        Object.entries(buttonMap).forEach(([selector, gameName]) => {
            $$(selector).forEach(button => {
                button.addEventListener("click", () => startGame(gameName));
            });
        });
    }


    /* ---------- 6. RESET / EXIT ---------- */

    function exitGame() {
        clearGame();

        const overlay = getOverlay();

        if (overlay) {
            overlay.hidden = false;
        }

        const field = getPlayfield();

        if (field) {
            field.replaceChildren();
        }

        arcade.activeGame = null;

        announce("Game closed. Choose another arcade challenge.");
    }

    [
        "#exit-game",
        "#close-game",
        "#back-to-arcade"
    ].forEach(selector => {
        $(selector)?.addEventListener("click", exitGame);
    });

    $("#reset-arcade")?.addEventListener("click", () => {
        exitGame();
        arcade.score = 0;
        updateScoreDisplay();
        announce("Current game reset. Your saved best score remains.");
    });


    /* ---------- 7. INITIALISE ARCADE ---------- */

    function initArcade() {
        arcade.bestScore = readNumber("sandyverse-arcade-best", 0);
        arcade.gamesPlayed = readNumber("sandyverse-arcade-played", 0);

        const bestLabel =
            $("#arcade-best-score") ||
            $("#game-best-score");

        const playedLabel = $("#arcade-games-played");

        if (bestLabel) {
            bestLabel.textContent = String(arcade.bestScore);
        }

        if (playedLabel) {
            playedLabel.textContent = String(arcade.gamesPlayed);
        }

        connectGameButtons();

        if (getPlayfield()) {
            announce("ARCADE ONLINE. Select a game to begin, Agent Sandy.");
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initArcade);
    } else {
        initArcade();
    }

    // Expose a small interface for testing or other local scripts.
    window.SANDYVERSE_ARCADE = {
        start: startGame,
        exit: exitGame,
        getStats: () => ({
            currentScore: arcade.score,
            gamesPlayed: readNumber("sandyverse-arcade-played", 0),
            bestScore: readNumber("sandyverse-arcade-best", 0)
        })
    };
})();
