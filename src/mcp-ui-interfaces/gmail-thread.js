(() => {
	const header = document.createElement("north-text-h1");
	const p = document.createElement("north-text-p");
	const textArea = document.createElement("north-text-area");
	const button = document.createElement("north-button");
	const buttonView = document.createElement("north-button");
	buttonView.setAttribute("label", "View full message");

	header.setAttribute("content", `{{subject}}`);
	p.setAttribute("content", `{{body}}`);
	textArea.setAttribute("id", "response-{{messageId}}");
	button.setAttribute("label", "Create a draft");

	const form = document.createElement("north-form");

	function handleSubmit(response) {
		console.log(
			"posting message for thread id: {{threadId}} and message id: {{messageId}}",
		);
		console.log(response);
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
	}
	form.addEventListener("submit", handleSubmit);

	function handleViewMore() {
		console.log(
			"Viewing message for: {{threadId}} and message id: {{messageId}}",
		);

		const params = {
			type: "tool",
			payload: {
				toolName: "gmail-thread-full",
				params: {
					threadId: "{{threadId}}",
				},
			},
		};
		console.log(params);
		window.top.postMessage(params, "*");
	}
	buttonView.addEventListener("press", handleViewMore);

	root.appendChild(header);
	root.appendChild(p);
	root.appendChild(buttonView);
	root.appendChild(form);
})();
