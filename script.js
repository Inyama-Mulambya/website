document.addEventListener("DOMContentLoaded", () => {
  const serviceSelector = document.getElementById("serviceSelector");
  const astronomyBlock = document.getElementById("astronomyBlock");
  const sensingBlock = document.getElementById("sensingBlock");
  const sensingDomain = document.getElementById("sensingDomain");
  const sensingSpecifyBlock = document.getElementById("sensingSpecifyBlock");
  const missionForm = document.getElementById("missionForm");

  // 1. Dynamic Dropdown Switching Engine
  if (serviceSelector && astronomyBlock && sensingBlock) {
    serviceSelector.addEventListener("change", (e) => {
      const selection = e.target.value;
      if (selection === "astronomy") {
        astronomyBlock.style.display = "flex";
        sensingBlock.style.display = "none";
        setRequiredFields(astronomyBlock, true);
        setRequiredFields(sensingBlock, false);
      } else if (selection === "remotesensing") {
        astronomyBlock.style.display = "none";
        sensingBlock.style.display = "flex";
        setRequiredFields(astronomyBlock, false);
        setRequiredFields(sensingBlock, true);
        if (sensingDomain) triggerSensingSpecifyToggle();
      }
    });
  }

  // 2. Inner Specific Toggle for Remote Sensing Options
  if (sensingDomain && sensingSpecifyBlock) {
    sensingDomain.addEventListener("change", triggerSensingSpecifyToggle);
  }

  function triggerSensingSpecifyToggle() {
    if (sensingDomain.value === "other") {
      sensingSpecifyBlock.style.display = "block";
      const input = sensingSpecifyBlock.querySelector("input");
      if (input) input.setAttribute("required", "true");
    } else {
      sensingSpecifyBlock.style.display = "none";
      const input = sensingSpecifyBlock.querySelector("input");
      if (input) input.removeAttribute("required");
    }
  }

  // 3. Form Validation Helper
  function setRequiredFields(parentBlock, isRequired) {
    const inputs = parentBlock.querySelectorAll("input, select");
    inputs.forEach(el => {
      if (isRequired) {
        el.setAttribute("required", "true");
      } else {
        el.removeAttribute("required");
      }
    });
  }

  // 4. FIXED: Formspree AJAX Submit Engine (Prevents "Method Unsupported" Errors)
  if (missionForm) {
    missionForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Stop standard browser handling
      
      const submitButton = missionForm.querySelector("button[type='submit']");
      const originalText = submitButton.textContent;
      submitButton.textContent = "Transmitting Flight Plan...";
      submitButton.disabled = true;

      const formData = new FormData(missionForm);

      try {
        const response = await fetch(missionForm.action, {
          method: "POST", // Absolutely guarantees POST is utilized
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          alert("Flight Plan Committed Successfully! Ground Control has logged your coordinates.");
          missionForm.reset();
          // Reset block viewports to hidden initial state
          if (astronomyBlock) astronomyBlock.style.display = "none";
          if (sensingBlock) sensingBlock.style.display = "none";
          if (sensingSpecifyBlock) sensingSpecifyBlock.style.display = "none";
        } else {
          const data = await response.json();
          if (data.errors) {
            alert("Submission error: " + data.errors.map(error => error.message).join(", "));
          } else {
            alert("Transmission rejected by gateway. Please verify your Formspree ID.");
          }
        }
      } catch (error) {
        alert("Network timeout. Communication link failure with Formspree servers.");
      } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    });
  }
});
