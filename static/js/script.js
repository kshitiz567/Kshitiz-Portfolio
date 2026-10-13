
document.addEventListener("DOMContentLoaded", () => {
    // Update the copyright year.
    const yearElement = document.getElementById("year");
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Smooth navigation.
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }

            const target = document.querySelector(targetId);

            if (target) {
                event.preventDefault();
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });

    // Ask Kshitiz chat elements.
    const toggle = document.getElementById("chat-toggle");
    const panel = document.getElementById("chat-panel");
    const close = document.getElementById("chat-close");
    const form = document.getElementById("chat-form");
    const input = document.getElementById("chat-input");
    const messages = document.getElementById("chat-messages");
    const sendButton = document.getElementById("chat-send");

    if (!toggle || !panel || !close || !form ||
        !input || !messages || !sendButton) {
        return;
    }

    function openChat() {
        panel.hidden = false;
        toggle.hidden = true;
        input.focus();
    }

    function closeChat() {
        panel.hidden = true;
        toggle.hidden = false;
        toggle.focus();
    }

    toggle.addEventListener("click", openChat);
    close.addEventListener("click", closeChat);

    function addMessage(text, sender) {
        const message = document.createElement("div");
        message.className = `chat-message ${sender}-message`;
        // textContent prevents AI/user text from being interpreted as HTML.
        message.textContent = text;
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
        return message;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const question = input.value.trim();
        if (!question || sendButton.disabled) return;

        addMessage(question, "user");
        input.value = "";
        input.disabled = true;
        sendButton.disabled = true;

        const waiting = addMessage("Thinking…", "assistant");

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: question })
            });

            const data = await response.json();
            waiting.remove();

            if (!response.ok) {
                addMessage(
                    data.error || "Sorry, something went wrong.",
                    "assistant"
                );
            } else {
                addMessage(
                    data.answer || "I couldn't generate an answer.",
                    "assistant"
                );
            }
        } catch (error) {
            waiting.remove();
            addMessage(
                "I couldn't connect to the assistant. Please try again.",
                "assistant"
            );
            console.error("Chat request failed:", error);
        } finally {
            input.disabled = false;
            sendButton.disabled = false;
            input.focus();
        }
    });
});

