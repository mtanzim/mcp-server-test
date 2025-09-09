(() => {
  const header = document.createElement("north-text-h1");
  const p = document.createElement("north-text-p");
  const textArea = document.createElement("north-text-area");
  const button = document.createElement("north-button");

  header.setAttribute("content", "{{subject}}");
  p.setAttribute("content", "{{body}}");
  textArea.setAttribute("id", "response-{{messageId}}");
  button.setAttribute("label", "Send");
  button.addEventListener("press", () => {
    const response = document.getElementById("response-{{messageId}}").value;
    console.log(
      "posting message for thread id: {{threadId}} and message id: {{messageId}}"
    );
    const params = {
      type: "tool",
      payload: {
        toolName: "gmail-draft-response",
        params: {
          address: "{{senderAddress}}",
          threadId: "{{threadId}}",
          subject: "{{subject}}",
          messageId: "{{messageId}}",
          content: response,
        },
      },
    };
    console.log(params);
    window.top.postMessage(params, "*");
  });

  root.appendChild(header);
  root.appendChild(p);
  root.appendChild(textArea);
  root.appendChild(button);
})();
