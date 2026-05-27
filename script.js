document.addEventListener("DOMContentLoaded", () => {
  const serviceSelector = document.getElementById("serviceSelector");
  const astronomyBlock = document.getElementById("astronomyBlock");
  const sensingBlock = document.getElementById("sensingBlock");
  const sensingDomain = document.getElementById("sensingDomain");
  const sensingSpecifyBlock = document.getElementById("sensingSpecifyBlock");

  // Conditional Fields Visibility Toggle Switch
  if (serviceSelector) {
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
        triggerSensingSpecifyToggle(); // Re-evaluate inner sub-fields if selection returns
      }
    });
  }

  // Inner Specific Toggle logic for Remote Sensing Options
  if (sensingDomain) {
    sensingDomain.addEventListener("change", triggerSensingSpecifyToggle);
  }

  function triggerSensingSpecifyToggle() {
    if (sensingDomain.value === "other") {
      sensingSpecifyBlock.style.display = "block";
      sensingSpecifyBlock.querySelector("input").setAttribute("required", "true");
    } else {
      sensingSpecifyBlock.style.display = "none";
      sensingSpecifyBlock.querySelector("input").removeAttribute("required");
    }
  }

  // Helper macro to ensure correct forms compliance behavior
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
});

