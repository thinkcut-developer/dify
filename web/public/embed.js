/** this file is used to embed the chatbot in a website
 * the difyChatbotConfig should be defined in the html file before this script is included
 * the difyChatbotConfig should contain the token of the chatbot
 * the token can be found in the chatbot settings page
 */

// attention: This JavaScript script must be placed after the <body> element. Otherwise, the script will not work.

(function () {
  // Constants for DOM element IDs and configuration key
  const configKey = "difyChatbotConfig";
  const buttonId = "dify-chatbot-bubble-button";
  const iframeId = "dify-chatbot-bubble-window";
  const config = window[configKey];
  let isExpanded = false;
  window.difyChatbot = window.difyChatbot || {};

  // SVG icons for open and close states
  const svgIcons = `<svg id="openIcon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3.5C7.24 3.5 3.5 6.95 3.5 11.2C3.5 13.67 4.78 15.91 6.93 17.4C6.98 17.43 7 17.49 6.99 17.55L6.58 19.78C6.51 20.18 6.93 20.49 7.28 20.29L9.55 18.96C9.61 18.93 9.68 18.92 9.74 18.94C10.46 19.14 11.22 19.24 12 19.24C16.76 19.24 20.5 15.8 20.5 11.54C20.5 7.3 16.76 3.5 12 3.5Z" fill="#E2E8F0"/>
      <circle cx="8.7" cy="11.35" r="1.15" fill="#22D3EE"/>
      <circle cx="12" cy="11.35" r="1.15" fill="#22D3EE"/>
      <circle cx="15.3" cy="11.35" r="1.15" fill="#22D3EE"/>
      <path d="M17.85 5.2L18.32 6.3L19.42 6.77L18.32 7.24L17.85 8.34L17.38 7.24L16.28 6.77L17.38 6.3L17.85 5.2Z" fill="#E2E8F0"/>
    </svg>
    <svg id="closeIcon" style="display:none" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 18L6 6M6 18L18 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    `;


  const originalIframeStyleText = `
    position: fixed;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    top: unset;
    right: var(--${buttonId}-right, 1rem); /* Align with dify-chatbot-bubble-button. */
    bottom: var(--${buttonId}-bottom, 1rem); /* Align with dify-chatbot-bubble-button. */
    left: unset;
    width: 25.5rem;
    max-width: calc(100vw - 1.5rem);
    height: 44rem;
    max-height: calc(100vh - 5rem);
    border: 1px solid rgba(34, 211, 238, 0.28);
    border-radius: 1.25rem;
    background: linear-gradient(180deg, #0b1220 0%, #060b16 100%);
    box-shadow:
      0 28px 56px rgba(2, 6, 23, 0.6),
      0 12px 28px rgba(34, 211, 238, 0.16);
    z-index: 2147483640;
    overflow: hidden;
    user-select: none;
    transition-property: width, height, transform, opacity;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 180ms;
  `

  const expandedIframeStyleText = `
    position: fixed;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    top: unset;
    left: unset;
    right: var(--${buttonId}-right, 1rem);
    bottom: var(--${buttonId}-bottom, 1rem);
    width: 920px;
    height: 780px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
    min-width: 920px;
    min-height: 780px;
    border: 1px solid rgba(34, 211, 238, 0.24);
    border-radius: 1.25rem;
    background: #050914;
    box-shadow:
      0 36px 64px rgba(2, 6, 23, 0.62),
      0 16px 30px rgba(8, 47, 73, 0.26);
    transform: none;
    z-index: 2147483640;
    overflow: hidden;
    user-select: none;
    transition-property: width, height, transform, opacity;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 180ms;
  `

  const mobileExpandedIframeStyleText = `
    position: fixed;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    top: unset;
    left: unset;
    right: var(--${buttonId}-right, 0.5rem);
    bottom: var(--${buttonId}-bottom, 0.5rem);
    width: 420px;
    height: 760px;
    max-width: calc(100vw - 16px);
    max-height: calc(100vh - 16px);
    min-width: 420px;
    min-height: 760px;
    border: 1px solid rgba(34, 211, 238, 0.24);
    border-radius: 1rem;
    background: #050914;
    box-shadow:
      0 28px 56px rgba(2, 6, 23, 0.58),
      0 12px 24px rgba(8, 47, 73, 0.24);
    transform: none;
    z-index: 2147483640;
    overflow: hidden;
    user-select: none;
    transition-property: width, height, transform, opacity;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 180ms;
  `

  // Main function to embed the chatbot
  async function embedChatbot() {
    let isDragging = false

    if (!config || !config.token) {
      console.error(`${configKey} is empty or token is not provided`);
      return;
    }

    async function compressAndEncodeBase64(input) {
      const uint8Array = new TextEncoder().encode(input);
      const compressedStream = new Response(
        new Blob([uint8Array])
          .stream()
          .pipeThrough(new CompressionStream("gzip"))
      ).arrayBuffer();
      const compressedUint8Array = new Uint8Array(await compressedStream);
      return btoa(String.fromCharCode(...compressedUint8Array));
    }

    async function getCompressedInputsFromConfig() {
      const inputs = config?.inputs || {};
      const compressedInputs = {};
      await Promise.all(
        Object.entries(inputs).map(async ([key, value]) => {
          compressedInputs[key] = await compressAndEncodeBase64(value);
        })
      );
      return compressedInputs;
    }

    async function getCompressedSystemVariablesFromConfig() {
      const systemVariables = config?.systemVariables || {};
      const compressedSystemVariables = {};
      await Promise.all(
        Object.entries(systemVariables).map(async ([key, value]) => {
          compressedSystemVariables[`sys.${key}`] = await compressAndEncodeBase64(value);
        })
      );
      return compressedSystemVariables;
    }

    async function getCompressedUserVariablesFromConfig() {
      const userVariables = config?.userVariables || {};
      const compressedUserVariables = {};
      await Promise.all(
        Object.entries(userVariables).map(async ([key, value]) => {
          compressedUserVariables[`user.${key}`] = await compressAndEncodeBase64(value);
        })
      );
      return compressedUserVariables;
    }

    const params = new URLSearchParams({
      ...await getCompressedInputsFromConfig(),
      ...await getCompressedSystemVariablesFromConfig(),
      ...await getCompressedUserVariablesFromConfig()
    });

    const baseUrl =
      config.baseUrl || `https://${config.isDev ? "dev." : ""}udify.app`;
    const targetOrigin = new URL(baseUrl).origin;

    // pre-check the length of the URL
    const iframeUrl = `${baseUrl}/chatbot/${config.token}?${params}`;
    // 1) CREATE the iframe immediately, so it can load in the background:
    const preloadedIframe = createIframe();
    // 2) HIDE it by default:
    preloadedIframe.style.display = "none";
    // 3) APPEND it to the document body right away:
    document.body.appendChild(preloadedIframe);
    // ─── End Fix Snippet
    if (iframeUrl.length > 2048) {
      console.error("The URL is too long, please reduce the number of inputs to prevent the bot from failing to load");
    }

    // Function to create the iframe for the chatbot
    function createIframe() {
      const iframe = document.createElement("iframe");
      iframe.allow = "fullscreen;microphone";
      iframe.title = "dify chatbot bubble window";
      iframe.id = iframeId;
      iframe.src = iframeUrl;
      iframe.style.cssText = originalIframeStyleText;

      return iframe;
    }

    // Function to reset the iframe position
    function resetIframePosition() {
      if (window.innerWidth <= 640) return;

      const targetIframe = document.getElementById(iframeId);
      const targetButton = document.getElementById(buttonId);
      if (targetIframe && targetButton) {
        if (isExpanded) return;

        const buttonRect = targetButton.getBoundingClientRect();
        // We don't necessarily need iframeRect anymore with the center logic

        const viewportCenterY = window.innerHeight / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;

        if (buttonCenterY < viewportCenterY) {
          targetIframe.style.top = `var(--${buttonId}-bottom, 1rem)`;
          targetIframe.style.bottom = 'unset';
        } else {
          targetIframe.style.bottom = `var(--${buttonId}-bottom, 1rem)`;
          targetIframe.style.top = 'unset';
        }

        const viewportCenterX = window.innerWidth / 2;
        const buttonCenterX = buttonRect.left + buttonRect.width / 2;

        if (buttonCenterX < viewportCenterX) {
          targetIframe.style.left = `var(--${buttonId}-right, 1rem)`;
          targetIframe.style.right = 'unset';
        } else {
          targetIframe.style.right = `var(--${buttonId}-right, 1rem)`;
          targetIframe.style.left = 'unset';
        }
      }
    }

    function toggleExpand() {
      isExpanded = !isExpanded;

      const targetIframe = document.getElementById(iframeId);
      if (!targetIframe) return;

      if (isExpanded) {
        targetIframe.style.cssText = window.innerWidth <= 640 ? mobileExpandedIframeStyleText : expandedIframeStyleText;
      } else {
        targetIframe.style.cssText = originalIframeStyleText;
      }
      resetIframePosition();
    }

    window.addEventListener('message', (event) => {
      if (event.origin !== targetOrigin) return;

      const targetIframe = document.getElementById(iframeId);
      if (!targetIframe || event.source !== targetIframe.contentWindow) return;

      if (event.data.type === 'dify-chatbot-iframe-ready') {
        targetIframe.contentWindow?.postMessage(
          {
            type: 'dify-chatbot-config',
            payload: {
              isToggledByButton: true,
              isDraggable: !!config.draggable,
            },
          },
          targetOrigin
        );
      }

      if (event.data.type === 'dify-chatbot-expand-change') {
        toggleExpand();
      }
    });

    window.difyChatbot.reset = function resetChatbotConversation() {
      const targetIframe = document.getElementById(iframeId);
      if (!targetIframe || !targetIframe.contentWindow)
        return;

      targetIframe.contentWindow.postMessage(
        { type: 'dify-chatbot-reset' },
        targetOrigin
      );
    };

    // Function to create the chat button
    function createButton() {
      const containerDiv = document.createElement("div");
      // Apply custom properties from config
      Object.entries(config.containerProps || {}).forEach(([key, value]) => {
        if (key === "className") {
          containerDiv.classList.add(...value.split(" "));
        } else if (key === "style") {
          if (typeof value === "object") {
            Object.assign(containerDiv.style, value);
          } else {
            containerDiv.style.cssText = value;
          }
        } else if (typeof value === "function") {
          containerDiv.addEventListener(
            key.replace(/^on/, "").toLowerCase(),
            value
          );
        } else {
          containerDiv[key] = value;
        }
      });

      containerDiv.id = buttonId;

      // Add styles for the button
      const styleSheet = document.createElement("style");
      document.head.appendChild(styleSheet);
      styleSheet.sheet.insertRule(`
        #${containerDiv.id} {
          position: fixed;
          bottom: var(--${containerDiv.id}-bottom, 1rem);
          right: var(--${containerDiv.id}-right, 1rem);
          left: var(--${containerDiv.id}-left, unset);
          top: var(--${containerDiv.id}-top, unset);
          width: var(--${containerDiv.id}-width, 56px);
          height: var(--${containerDiv.id}-height, 56px);
          border-radius: var(--${containerDiv.id}-border-radius, 20px);
          background: var(--${containerDiv.id}-bg-color, linear-gradient(135deg, #020617 0%, #1E1B4B 44%, #0F766E 100%));
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: var(--${containerDiv.id}-box-shadow, 0 22px 36px rgba(8, 47, 73, 0.5), 0 12px 24px rgba(2, 6, 23, 0.42));
          cursor: pointer;
          overflow: hidden;
          transform: translateZ(0);
          transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 180ms ease, filter 180ms ease;
          -webkit-tap-highlight-color: transparent;
          z-index: 2147483647;
        }
      `);
      styleSheet.sheet.insertRule(`
        #${containerDiv.id}::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          background: radial-gradient(120% 120% at 18% 10%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 62%);
          pointer-events: none;
          z-index: 0;
        }
      `);
      styleSheet.sheet.insertRule(`
        #${containerDiv.id}:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 26px 44px rgba(8, 47, 73, 0.56), 0 14px 28px rgba(2, 6, 23, 0.44);
          filter: brightness(1.08);
        }
      `);
      styleSheet.sheet.insertRule(`
        #${containerDiv.id}:active {
          transform: translateY(0) scale(0.98);
          filter: saturate(1.1);
        }
      `);

      // Create display div for the button icon
      const displayDiv = document.createElement("div");
      displayDiv.style.cssText =
        "position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; z-index: 2147483647; backdrop-filter: saturate(1.12);";
      displayDiv.innerHTML = svgIcons;
      containerDiv.appendChild(displayDiv);
      document.body.appendChild(containerDiv);

      // Add click event listener to toggle chatbot
      containerDiv.addEventListener("click", handleClick);
      // Add touch event listener
      containerDiv.addEventListener("touchend", (event) => {
        event.preventDefault();
        handleClick();
      }, { passive: false });

      function handleClick() {
        if (isDragging) return;

        const targetIframe = document.getElementById(iframeId);
        if (!targetIframe) {
          containerDiv.appendChild(createIframe());
          resetIframePosition();
          this.title = "Exit (ESC)";
          setSvgIcon("close");
          document.addEventListener("keydown", handleEscKey);
          return;
        }
        targetIframe.style.display =
          targetIframe.style.display === "none" ? "block" : "none";
        targetIframe.style.display === "none"
          ? setSvgIcon("open")
          : setSvgIcon("close");

        if (targetIframe.style.display === "none") {
          document.removeEventListener("keydown", handleEscKey);
        } else {
          document.addEventListener("keydown", handleEscKey);
        }

        resetIframePosition();
      }

      // Enable dragging if specified in config
      if (config.draggable) {
        enableDragging(containerDiv, config.dragAxis || "both");
      }
    }

    // Function to enable dragging of the chat button
    function enableDragging(element, axis) {
      let startX, startY, startClientX, startClientY;

      element.addEventListener("mousedown", startDragging);
      element.addEventListener("touchstart", startDragging);

      function startDragging(e) {
        isDragging = false;
        if (e.type === "touchstart") {
          startX = e.touches[0].clientX - element.offsetLeft;
          startY = e.touches[0].clientY - element.offsetTop;
          startClientX = e.touches[0].clientX;
          startClientY = e.touches[0].clientY;
        } else {
          startX = e.clientX - element.offsetLeft;
          startY = e.clientY - element.offsetTop;
          startClientX = e.clientX;
          startClientY = e.clientY;
        }
        document.addEventListener("mousemove", drag);
        document.addEventListener("touchmove", drag, { passive: false });
        document.addEventListener("mouseup", stopDragging);
        document.addEventListener("touchend", stopDragging);
        e.preventDefault();
      }

      function drag(e) {
        const touch = e.type === "touchmove" ? e.touches[0] : e;
        const deltaX = touch.clientX - startClientX;
        const deltaY = touch.clientY - startClientY;

        // Determine whether it is a drag operation
        if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
          isDragging = true;
        }

        if (!isDragging) return;

        element.style.transition = "none";
        element.style.cursor = "grabbing";

        // Hide iframe while dragging
        const targetIframe = document.getElementById(iframeId);
        if (targetIframe) {
          targetIframe.style.display = "none";
          setSvgIcon("open");
        }

        let newLeft, newBottom;
        if (e.type === "touchmove") {
          newLeft = e.touches[0].clientX - startX;
          newBottom = window.innerHeight - e.touches[0].clientY - startY;
        } else {
          newLeft = e.clientX - startX;
          newBottom = window.innerHeight - e.clientY - startY;
        }

        const elementRect = element.getBoundingClientRect();
        const maxX = window.innerWidth - elementRect.width;
        const maxY = window.innerHeight - elementRect.height;

        // Update position based on drag axis
        if (axis === "x" || axis === "both") {
          element.style.setProperty(
            `--${buttonId}-left`,
            `${Math.max(0, Math.min(newLeft, maxX))}px`
          );
        }

        if (axis === "y" || axis === "both") {
          element.style.setProperty(
            `--${buttonId}-bottom`,
            `${Math.max(0, Math.min(newBottom, maxY))}px`
          );
        }
      }

      function stopDragging() {
        setTimeout(() => {
          isDragging = false;
        }, 0);
        element.style.transition = "";
        element.style.cursor = "pointer";

        document.removeEventListener("mousemove", drag);
        document.removeEventListener("touchmove", drag);
        document.removeEventListener("mouseup", stopDragging);
        document.removeEventListener("touchend", stopDragging);
      }
    }

    // Create the chat button if it doesn't exist
    if (!document.getElementById(buttonId)) {
      createButton();
    }
  }

  function setSvgIcon(type = "open") {
    if (type === "open") {
      document.getElementById("openIcon").style.display = "block";
      document.getElementById("closeIcon").style.display = "none";
    } else {
      document.getElementById("openIcon").style.display = "none";
      document.getElementById("closeIcon").style.display = "block";
    }
  }

  // Add esc Exit keyboard event triggered
  function handleEscKey(event) {
    if (event.key === "Escape") {
      const targetIframe = document.getElementById(iframeId);
      if (targetIframe && targetIframe.style.display !== "none") {
        targetIframe.style.display = "none";
        setSvgIcon("open");
      }
    }
  }
  document.addEventListener("keydown", handleEscKey);

  // Set the embedChatbot function to run when the body is loaded,Avoid infinite nesting
  if (config?.dynamicScript) {
    embedChatbot();
  } else {
    document.body.onload = embedChatbot;
  }
})();
