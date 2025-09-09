let isDarkMode = false;

// Create the main container stack with centered alignment
const stack = document.createElement("ui-stack");
stack.setAttribute("direction", "vertical");
stack.setAttribute("spacing", "20");
stack.setAttribute("align", "center");

// Create the title text
const title = document.createElement("ui-text");
title.setAttribute("content", "Logo Toggle Demo");

// Create a centered container for the logo
const logoContainer = document.createElement("ui-stack");
logoContainer.setAttribute("direction", "vertical");
logoContainer.setAttribute("spacing", "0");
logoContainer.setAttribute("align", "center");

// Create the logo image (starts with light theme)
const logo = document.createElement("ui-image");
logo.setAttribute("src", "https://block.github.io/goose/img/logo_light.png");
logo.setAttribute("alt", "Goose Logo");
logo.setAttribute("width", "200");

// Create the toggle button
const toggleButton = document.createElement("ui-button");
toggleButton.setAttribute("label", "🌙 Switch to Dark Mode");

// Add the toggle functionality
toggleButton.addEventListener("press", () => {
  isDarkMode = !isDarkMode;

  if (isDarkMode) {
    // Switch to dark mode
    logo.setAttribute("src", "https://block.github.io/goose/img/logo_dark.png");
    logo.setAttribute("alt", "Goose Logo (Dark Mode)");
    toggleButton.setAttribute("label", "☀️ Switch to Light Mode");
  } else {
    // Switch to light mode
    logo.setAttribute(
      "src",
      "https://block.github.io/goose/img/logo_light.png"
    );
    logo.setAttribute("alt", "Goose Logo (Light Mode)");
    toggleButton.setAttribute("label", "🌙 Switch to Dark Mode");
  }

  console.log("Logo toggled to:", isDarkMode ? "dark" : "light", "mode");
});

// Assemble the UI
logoContainer.appendChild(logo);
stack.appendChild(title);
stack.appendChild(logoContainer);
stack.appendChild(toggleButton);
root.appendChild(stack);
