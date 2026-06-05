document.addEventListener("DOMContentLoaded", () => {
  const serviceSelector = document.getElementById("serviceSelector");
  const astronomyBlock = document.getElementById("astronomyBlock");
  const sensingBlock = document.getElementById("sensingBlock");
  const sensingDomain = document.getElementById("sensingDomain");
  const sensingSpecifyBlock = document.getElementById("sensingSpecifyBlock");
  const missionForm = document.getElementById("missionForm");
  const freeScanForm = document.getElementById("freeScanForm");

  // 1. DYNAMIC DROPDOWN SWITCHING ENGINE
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

  // 2. INNER SPECIFIC TOGGLE FOR REMOTE SENSING MAJORS
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

  // 3. MISSION BOOKING FORM SUBMISSION ENGINE (Clean Data Separation via Formspree)
  if (missionForm) {
    missionForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Lock default multi-stream tracking
      
      const submitButton = missionForm.querySelector("button[type='submit']");
      const originalText = submitButton.textContent;
      submitButton.textContent = "Transmitting...";
      submitButton.disabled = true;

      // Extract and separate fields based on choice
      const payloadData = new FormData();
      payloadData.append("_replyto", missionForm.querySelector("input[name='_replyto']").value);
      payloadData.append("core_service", serviceSelector.value);
      payloadData.append("target_mission_date", missionForm.querySelector("input[name='target_mission_date']").value);

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
          body: payloadData,
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
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

  // 4. FIXED AUTOMATED BACKEND: FREE CROP HEALTH SCAN PANEL SUBMISSION ENGINE
  if (freeScanForm) {
    freeScanForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Lock default tracking vectors
      
      const scanButton = freeScanForm.querySelector("button[type='submit']");
      const originalBtnText = scanButton.textContent;
      scanButton.textContent = "Processing Core Request...";
      scanButton.disabled = true;

      // EXTRACT RAW COORDINATE GEOMETRY STRING INPUTS (e.g., [[28.3,-14.9],[28.4,-14.9]...])
      const gpsValue = freeScanForm.querySelector("input[name='gps_coordinates']").value;
      
      let coordinateData;
      try {
        coordinateData = JSON.parse(gpsValue);
      } catch(e) {
        alert("Invalid geometry matrix structure. Please enter a valid JSON coordinate array for backend processing.");
        scanButton.textContent = originalBtnText;
        scanButton.disabled = false;
        return;
      }

      // Format payload payload to map backend request structures perfectly
      const backendPayload = {
        coordinates: coordinateData
      };

      // ====================================================================
      // 📍 REPLACE THIS LINK VALUE WITH YOUR ACTUAL DEPLOYED RENDER LINK ENGINE
      // ====================================================================
      const BACKEND_URL = "https://stari-ndvi-engine.onrender.com";
      // ====================================================================

      try {
        const response = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backendPayload)
        });

        if (response.ok) {
          const data = await response.json();
          alert("Scan array initialized! Satellite vectors successfully parsed.");
          
          // DYNAMIC VISUAL INJECTION: Render maps directly on user dashboard
          const dashboardPanel = document.querySelector(".portal-progress-bar").parentElement.parentElement;
          dashboardPanel.innerHTML = `
            <span class="tag" style="font-size: 11px; letter-spacing: 2px; color: #67e8f9;">LIVE TELEMETRY VIEW</span>
            <h2 style="font-size: 22px; margin: 5px 0 10px; font-weight: 800;">Your Crop Stress Map</h2>
            <div style="width:100%; height:250px; background:#020617; border-radius:12px; overflow:hidden; border:1px solid #67e8f9; position:relative;">
              <iframe src="${data.map_url.replace('{x}', '0').replace('{y}', '0').replace('{z}', '0')}" style="width:100%; height:100%; border:none;"></iframe>
            </div>
            <span class="tag" style="font-size: 10px; color:#94a3b8; display:block; text-align:center; margin-top:8px;">🟢 GREEN = HEALTHY • 🟡 YELLOW = STRESS • 🔴 RED = CRITICAL</span>
          `;

          freeScanForm.reset();
        } else {
          alert("Telemetry verification rejection. Ensure vector bounds are inside mapped parameters.");
        }
      } catch (error) {
        alert("Connection timed out. Check your link connection state with the satellite gates.");
      } finally {
        scanButton.textContent = originalBtnText;
        scanButton.disabled = false;
      }
    });
  }
});
