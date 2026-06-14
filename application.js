// Worker URL - configured in Cloudflare with Discord webhook secrets
const APPLICATION_API_URL = "https://loomwood-applications.weston-schmidt4.workers.dev";
// Turnstile siteverify Worker URL
const TURNSTILE_SITEVERIFY_URL = "https://turnstile-siteverify.weston-schmidt4.workers.dev";

const applicationForm = document.querySelector(".application-form");
const submitButton = applicationForm?.querySelector(".submit-button");
const formStatus = applicationForm?.querySelector(".form-status");

function setStatus(message, state = "") {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.dataset.state = state;
}

function collectAnswers(form) {
  const answers = [];
  const processedNames = new Set();

  form.querySelectorAll("[data-question]").forEach((field) => {
    if (processedNames.has(field.name)) return;
    processedNames.add(field.name);

    const group = Array.from(form.querySelectorAll(`[name="${CSS.escape(field.name)}"]`));
    let value = "";

    if (field.type === "checkbox") {
      value = group.filter((item) => item.checked).map((item) => item.value).join(", ");
    } else if (field.type === "radio") {
      value = group.find((item) => item.checked)?.value ?? "";
    } else {
      value = field.value.trim();
    }

    answers.push({
      question: field.dataset.question,
      value: value || "No response"
    });
  });

  return answers;
}

applicationForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!applicationForm.reportValidity()) return;

  const emptyRequiredGroup = Array.from(applicationForm.querySelectorAll("[data-required-group]"))
    .find((group) => !group.querySelector("input:checked"));

  if (emptyRequiredGroup) {
    emptyRequiredGroup.scrollIntoView({ behavior: "smooth", block: "center" });
    setStatus("Please select at least one option in each required group.", "error");
    return;
  }

  if (applicationForm.elements.website.value) {
    setStatus("Application received.", "success");
    return;
  }

  if (APPLICATION_API_URL.includes("YOUR-WORKER")) {
    setStatus("The secure Discord relay has not been configured yet.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "SUBMITTING...";
  setStatus("Verifying and sending your application...");

  try {
    // Step 1: Validate CAPTCHA token with Turnstile siteverify Worker
    const cfToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
    if (!cfToken) {
      setStatus("Please complete the CAPTCHA verification.", "error");
      submitButton.disabled = false;
      submitButton.textContent = "SUBMIT APPLICATION";
      return;
    }

    const turnstileResponse = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: cfToken })
    });

    const turnstileResult = await turnstileResponse.json().catch(() => ({}));
    if (!turnstileResult.success) {
      setStatus("CAPTCHA verification failed. Please try again.", "error");
      // Reset CAPTCHA
      window.turnstile?.reset?.();
      submitButton.disabled = false;
      submitButton.textContent = "SUBMIT APPLICATION";
      return;
    }

    // Step 2: Submit to Discord webhook via application worker
    const response = await fetch(APPLICATION_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationType: applicationForm.dataset.applicationType,
        submittedAt: new Date().toISOString(),
        answers: collectAnswers(applicationForm)
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Submission failed");

    applicationForm.reset();
    window.turnstile?.reset?.();
    setStatus("Application submitted successfully. Thank you! Redirecting...", "success");
    
    // Redirect to home after 5 seconds
    setTimeout(() => {
      window.location.href = "../";
    }, 5000);
  } catch (error) {
    setStatus(error.message || "Could not submit. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "SUBMIT APPLICATION";
  }
});
