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

  // 4. AUTOMATED BACKEND: FREE CROP HEALTH SCAN PANEL SUBMISSION ENGINE
  if (freeScanForm) {
    freeScanForm.addEventListener("submit", async (event) => {
      event.preventDefault(); 
      
      const scanButton = freeScanForm.querySelector("button[type='submit']");
      const originalBtnText = scanButton.textContent;
      scanButton.textContent = "Processing Core Request...";
      scanButton.disabled = true;

      const gpsValue = document.getElementById('geoCoordinates').value;
      
      if (!gpsValue) {
        alert("Please mark your farm boundaries on the terminal map before initializing scan arrays.");
        scanButton.textContent = originalBtnText;
        scanButton.disabled = false;
        return;
      }

      const backendPayload = {
        coordinates: JSON.parse(gpsValue)
      };

      const BACKEND_URL = "https://onrender.com";

      try {
        const response = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backendPayload)
        });

        if (response.ok) {
          const data = await response.json();
          alert("Scan array initialized! Satellite vectors successfully parsed.");
          
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
          // Reset internal script map elements
          if (typeof resetPortalMap === "function") resetPortalMap();
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

  // ==========================================================================
  // APPENDED HERE: INTERACTIVE LEAFLET FARM MAP COMPONENT SYSTEM
  // ==========================================================================
  const mapElement = document.getElementById('portalMap');
  if (mapElement) {
    // Centers tracking lens map viewport frame explicitly over Lusaka, Zambia coordinates
    const map = L.map('portalMap').setView([-15.4167, 28.2833], 10);

    // Loads sharp default map graphics engine panels from open source layout repositories
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let pointMarkers = [];
    let farmPolygon = null;
    const hiddenCoordsInput = document.getElementById('geoCoordinates');

    // Listens for mouse or touch interaction click inputs on map box framework surface
    map.on('click', (e) => {
      const lat = parseFloat(e.latlng.lat.toFixed(5));
      const lng = parseFloat(e.latlng.lng.toFixed(5));

      // Drops structural vector blue accent circular node point indicators on site layout
      const marker = L.circleMarker([lat, lng], { radius: 5, color: '#67e8f9', fillColor: '#020617', fillOpacity: 1 }).addTo(map);
      pointMarkers.push(marker);

      if (farmPolygon) map.removeLayer(farmPolygon);

      // Reformat map point markers to fit our backend script matrix expectation strings
      const coordArray = pointMarkers.map(m => [m.getLatLng().lng, m.getLatLng().lat]);
      
      if (coordArray.length >= 3) {
        // Automatically adds the closing boundary loop point matching entry index 0
        const closedLoop = [...coordArray, coordArray[0]];
        
        // Draws a shaded blue tracking frame highlight covering their fields bounds live
        farmPolygon = L.polygon(closedLoop.map(p => [p[1], p[0]]), { color: '#67e8f9', weight: 2, fillOpacity: 0.2 }).addTo(map);
        
        // Serializes data into hidden layout input string tags seamlessly
        hiddenCoordsInput.value = JSON.stringify(closedLoop);
      }
    });

    // Reset helper to clear visual maps layers if transactions complete successfully
    window.resetPortalMap = function() {
      pointMarkers.forEach(m => map.removeLayer(m));
      if (farmPolygon) map.removeLayer(farmPolygon);
      pointMarkers = [];
      farmPolygon = null;
      if (hiddenCoordsInput) hiddenCoordsInput.value = "";
    };
  }
});
