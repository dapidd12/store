(function(){
  // Utilities for UI consistency: message/toast and safe listener helpers
  function ensureMessageDiv() {
    let el = document.getElementById('message');
    if (!el) {
      el = document.createElement('div');
      el.id = 'message';
      el.className = 'fixed top-4 right-4 z-50 max-w-sm';
      document.body.appendChild(el);
    }
    return el;
  }

  function showMessage(type, text, opts = {}) {
    const messageDiv = ensureMessageDiv();
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const borderColor = type === 'success' ? 'border-green-400' : 'border-red-400';

    messageDiv.innerHTML = `
      <div class="${bgColor} border ${borderColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center">
        <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          ${type === 'success' ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>' : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>'}
        </svg>
        <span>${text}</span>
      </div>
    `;

    const timeout = opts.timeout || 3000;
    if (messageDiv._timeout) clearTimeout(messageDiv._timeout);
    messageDiv._timeout = setTimeout(() => {
      if (messageDiv) messageDiv.remove();
    }, timeout);
  }

  function safeAddListener(elId, event, handler) {
    const el = document.getElementById(elId);
    if (el) el.addEventListener(event, handler);
  }

  // Expose to global
  window.__utilsUI = {
    ensureMessageDiv,
    showMessage,
    safeAddListener
  };
})();
