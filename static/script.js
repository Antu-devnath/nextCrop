/**
 * NextCrop – Frontend Logic
 * ===========================
 * Handles form submission, validation, AJAX prediction request,
 * result display, and error handling.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide icons
    if (window.lucide) lucide.createIcons();

    // ----- DOM References --------------------------------------------------
    const form       = document.getElementById("prediction-form");
    const predictBtn = document.getElementById("predict-btn");
    const resultSec  = document.getElementById("result-section");
    const resultCrop = document.getElementById("result-crop");
    const btnNew     = document.getElementById("btn-new-prediction");
    const errorToast = document.getElementById("error-toast");
    const errorMsg   = document.getElementById("error-msg");
    const toastClose = document.getElementById("toast-close");

    // ----- Feature metadata ------------------------------------------------
    const FEATURE_ORDER = [
        "District", "Season", "Avg Temp", "Avg Humidity",
        "Transplant", "Growth", "Harvest",
        "Max Temp", "Min Temp",
        "Max Relative Humidity", "Min Relative Humidity"
    ];

    const NUMERICAL_FIELDS = [
        "Avg Temp", "Avg Humidity", "Max Temp", "Min Temp",
        "Max Relative Humidity", "Min Relative Humidity"
    ];

    // ----- Helpers ---------------------------------------------------------

    /** Show an error toast for a given duration (ms). */
    function showError(message, duration = 6000) {
        errorMsg.textContent = message;
        errorToast.classList.remove("hidden");
        // Force reflow before adding class so CSS transition fires
        void errorToast.offsetWidth;
        errorToast.classList.add("visible");

        clearTimeout(showError._timer);
        showError._timer = setTimeout(() => hideError(), duration);
    }

    function hideError() {
        errorToast.classList.remove("visible");
        setTimeout(() => errorToast.classList.add("hidden"), 350);
    }

    /** Mark a field as having an error. */
    function setFieldError(name, hasError) {
        const field = document.getElementById(name)?.closest(".field");
        if (!field) return;
        field.classList.toggle("error", hasError);
    }

    function clearAllFieldErrors() {
        document.querySelectorAll(".field.error").forEach(f => f.classList.remove("error"));
    }

    /** Toggle loading state on the submit button. */
    function setLoading(loading) {
        predictBtn.classList.toggle("loading", loading);
        predictBtn.disabled = loading;
    }

    /** Collect form data as a plain object preserving feature order. */
    function collectFormData() {
        const data = {};
        for (const name of FEATURE_ORDER) {
            const el = document.getElementById(name);
            if (!el) continue;
            data[name] = el.value;
        }
        return data;
    }

    /** Validate that all fields are filled and numerics are valid. */
    function validateForm(data) {
        let valid = true;
        clearAllFieldErrors();

        for (const name of FEATURE_ORDER) {
            const val = (data[name] ?? "").toString().trim();
            if (val === "") {
                setFieldError(name, true);
                valid = false;
                continue;
            }

            if (NUMERICAL_FIELDS.includes(name)) {
                const num = Number(val);
                if (isNaN(num)) {
                    setFieldError(name, true);
                    valid = false;
                }
            }
        }

        if (!valid) {
            showError("Please fill in all required fields with valid values.");
        }
        return valid;
    }

    /** Smoothly scroll an element into the viewport. */
    function scrollIntoViewSmooth(el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // ----- Form Submission -------------------------------------------------
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = collectFormData();
        if (!validateForm(data)) return;

        setLoading(true);
        hideError();

        try {
            const resp = await fetch("/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await resp.json();

            if (!resp.ok || !result.success) {
                throw new Error(result.error || "Prediction request failed.");
            }

            // Show result
            resultCrop.textContent = result.prediction;
            resultSec.classList.remove("hidden");
            resultSec.classList.add("visible");

            // Re-render icons in the result card
            if (window.lucide) lucide.createIcons();

            // Scroll to result
            setTimeout(() => scrollIntoViewSmooth(resultSec), 100);

        } catch (err) {
            showError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    });

    // ----- New Prediction --------------------------------------------------
    btnNew.addEventListener("click", () => {
        // Hide result
        resultSec.classList.remove("visible");
        resultSec.classList.add("hidden");

        // Reset form
        form.reset();
        clearAllFieldErrors();

        // Scroll back to form
        scrollIntoViewSmooth(form);
    });

    // ----- Error Toast Close -----------------------------------------------
    toastClose.addEventListener("click", () => hideError());

    // ----- Input interactivity: clear error on change ----------------------
    FEATURE_ORDER.forEach((name) => {
        const el = document.getElementById(name);
        if (!el) return;
        el.addEventListener("input", () => setFieldError(name, false));
        el.addEventListener("change", () => setFieldError(name, false));
    });
});
