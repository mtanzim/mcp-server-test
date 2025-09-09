const button = document.createElement("ui-button");
button.setAttribute("label", "Yo Click me for a top tool call!");
button.addEventListener("press", () => {
  console.log("I was clicked");
  window.top.postMessage(
    {
      type: "tool",
      payload: {
        toolName: "uiInteraction",
        params: { action: "button-click", from: "remote-dom" },
      },
    },
    "*"
  );
});
root.appendChild(button);
