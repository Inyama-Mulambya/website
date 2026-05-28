document.addEventListener("DOMContentLoaded", () => {
  const serviceSelector = document.getElementById("serviceSelector");
  const astronomyBlock = document.getElementById("astronomyBlock");
  const sensingBlock = document.getElementById("sensingBlock");
  const sensingDomain = document.getElementById("sensingDomain");
  const sensingSpecifyBlock = document.getElementById("sensingSpecifyBlock");
  const missionForm = document.getElementById("missionForm");

  // 1. Dynamic UI Viewport Visibility Handling
  if (serviceSelector && astronomyBlock && sensingBlock) {
    serviceSelector.addEventListener("change", (e) => {
      const selection = e.target.value;
      if (selection === "astronomy") {
        astronomyBlock.style.display = "flex";
        sensingBlock.style.display = "none";
      } else if (selection === "remotesensing") {
        astronomyBlock.style.display = "none";
        sensingBlock.style.display = "flex";
        if (sensingDomain) triggerSensingSpecifyToggle();
      }
    });
  }

  if (sensingDomain && sensingSpecifyBlock) {
    sensingDomain.addEventListener("change", triggerSensingSpecifyToggle);
  }

  function triggerSensingSpecifyToggle() {
    if (sensingDomain.value === "other") {
      sensingSpecifyBlock.style.display = "block";
    } else {
      sensingSpecifyBlock.style.display = "none";
    }
  }

  // 2. FIXED payload routing + clean custom messaging
  if (missionForm) {
    missionForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Halt default multi-stream tracking
      
      const submitButton = missionForm.querySelector("button[type='submit']");
      const originalText = submitButton.textContent;
      submitButton.textContent = "Transmitting...";
      submitButton.disabled = true;

      // Create a clean data builder snapshot
      const payloadData = new FormData();
      
      // Always append global primary data rows
      payloadData.append("_replyto", missionForm.querySelector("input[name='_replyto']").value);
      payloadData.append("core_service", serviceSelector.value);
      payloadData.append("target_mission_date", missionForm.querySelector("input[name='target_mission_date']").value);

      // CONDITIONAL EXTRACTION ENGINE: Only pull data from the active visual block
      if (serviceSelector.value === "astronomy") {
        payloadData.append("astro_focus", astronomyBlock.querySelector("select[name='astro_focus']").value);
        payloadData.append("astro_type", astronomyBlock.querySelector("select[name='astro_type']").value);
      } else if (serviceSelector.value === "remotesensing") {
        payloadData.append("sensing_domain", sensingBlock.querySelector("select[name='sensing_domain']").value);
        payloadData.append("sensing_route", sensingBlock.querySelector("select[name='sensing_route']").value);
        
        if (sensingDomain.value === "other") {
          payloadData.append("sensing_specify", sensingBlock.querySelector("input[name='sensing_specify']").value);
        }
      }

      try {
        const response = await fetch(missionForm.action, {
          method: "POST",
          body: payloadData, // Dispatches the cleanly separated layout fields only
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          // Your explicit message format update
          alert("Your booking was successful! We will contact you shortly. Thank you.");
          missionForm.reset();
          if (astronomyBlock) astronomyBlock.style.display = "none";
          if (sensingBlock) sensingBlock.style.display = "none";
          if (sensingSpecifyBlock) sensingSpecifyBlock.style.display = "none";
        } else {
          alert("Transmission error. Please check your data variables.");
        }
      } catch (error) {
        alert("Network error. Unable to establish contact with backend telemetry lines.");
      } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    });
  }
});
