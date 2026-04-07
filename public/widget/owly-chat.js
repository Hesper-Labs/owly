/**
 * Owly Live Chat Widget
 * Embeddable chat widget for customer websites.
 *
 * Usage:
 * <script src="https://your-owly-instance.com/widget/owly-chat.js"
 *   data-server="https://your-owly-instance.com"
 *   data-color="#0F172A"
 *   data-position="right"
 *   data-greeting="Hi! How can we help you today?"
 * ></script>
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var config = {
    server: script.getAttribute("data-server") || window.location.origin,
    color: script.getAttribute("data-color") || "#0F172A",
    position: script.getAttribute("data-position") || "right",
    greeting: script.getAttribute("data-greeting") || "Hi! How can we help you today?",
    title: script.getAttribute("data-title") || "Support Chat",
  };

  var conversationId = null;
  var isOpen = false;

  function createStyles() {
    var style = document.createElement("style");
    style.textContent = "\n\
      #owly-widget-container{position:fixed;bottom:20px;" + config.position + ":20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}\n\
      #owly-widget-btn{width:56px;height:56px;border-radius:50%;background:" + config.color + ";border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:transform .2s}\n\
      #owly-widget-btn:hover{transform:scale(1.05)}\n\
      #owly-widget-btn svg{width:24px;height:24px;fill:#fff}\n\
      #owly-widget-panel{display:none;width:370px;height:520px;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.12);margin-bottom:12px;overflow:hidden;flex-direction:column}\n\
      #owly-widget-panel.open{display:flex}\n\
      #owly-widget-header{background:" + config.color + ";color:#fff;padding:16px;display:flex;align-items:center;justify-content:space-between}\n\
      #owly-widget-header h3{margin:0;font-size:15px;font-weight:600}\n\
      #owly-widget-close{background:none;border:none;color:#fff;cursor:pointer;font-size:20px;padding:0;line-height:1}\n\
      #owly-widget-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px}\n\
      .owly-msg{max-width:80%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.4;word-wrap:break-word}\n\
      .owly-msg.bot{background:#F1F5F9;color:#1E293B;align-self:flex-start;border-bottom-left-radius:4px}\n\
      .owly-msg.user{background:" + config.color + ";color:#fff;align-self:flex-end;border-bottom-right-radius:4px}\n\
      .owly-msg.typing{color:#94A3B8;font-style:italic}\n\
      #owly-widget-input{display:flex;border-top:1px solid #E2E8F0;padding:12px}\n\
      #owly-widget-input input{flex:1;border:1px solid #E2E8F0;border-radius:8px;padding:10px 14px;font-size:14px;outline:none}\n\
      #owly-widget-input input:focus{border-color:" + config.color + "}\n\
      #owly-widget-input button{background:" + config.color + ";color:#fff;border:none;border-radius:8px;padding:10px 16px;margin-left:8px;cursor:pointer;font-size:14px}\n\
    ";
    document.head.appendChild(style);
  }

  function createWidget() {
    var container = document.createElement("div");
    container.id = "owly-widget-container";
    container.innerHTML = '\
      <div id="owly-widget-panel">\
        <div id="owly-widget-header">\
          <h3>' + config.title + '</h3>\
          <button id="owly-widget-close">&times;</button>\
        </div>\
        <div id="owly-widget-messages"></div>\
        <div id="owly-widget-input">\
          <input type="text" placeholder="Type a message..." id="owly-widget-text" />\
          <button id="owly-widget-send">Send</button>\
        </div>\
      </div>\
      <button id="owly-widget-btn">\
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>\
      </button>\
    ';
    document.body.appendChild(container);

    document.getElementById("owly-widget-btn").onclick = toggleWidget;
    document.getElementById("owly-widget-close").onclick = toggleWidget;
    document.getElementById("owly-widget-send").onclick = sendMessage;
    document.getElementById("owly-widget-text").onkeypress = function (e) {
      if (e.key === "Enter") sendMessage();
    };
  }

  function toggleWidget() {
    isOpen = !isOpen;
    var panel = document.getElementById("owly-widget-panel");
    panel.classList.toggle("open", isOpen);
    if (isOpen && !document.querySelector(".owly-msg")) {
      addMessage(config.greeting, "bot");
    }
  }

  function addMessage(text, type) {
    var messages = document.getElementById("owly-widget-messages");
    var msg = document.createElement("div");
    msg.className = "owly-msg " + type;
    msg.textContent = text;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
    return msg;
  }

  function sendMessage() {
    var input = document.getElementById("owly-widget-text");
    var text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    var typing = addMessage("Typing...", "bot typing");

    fetch(config.server + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        conversationId: conversationId,
        channel: "widget",
        customerName: "Website Visitor",
      }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        typing.remove();
        conversationId = data.conversationId;
        addMessage(data.response || "Sorry, I could not process your request.", "bot");
      })
      .catch(function () {
        typing.remove();
        addMessage("Connection error. Please try again.", "bot");
      });
  }

  // Initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      createStyles();
      createWidget();
    });
  } else {
    createStyles();
    createWidget();
  }
})();
