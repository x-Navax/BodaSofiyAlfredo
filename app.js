'use strict';
(() => {
  const config = window.INVITATION_CONFIG;
  const target = new Date(config.eventDate).getTime();
  const el = (id) => document.getElementById(id);
  // Keep the artwork at its original 3:4 proportion. Fit the text inside
  // the opening without changing the height or stretching the frame.
  const frame = document.querySelector('.hero-card');
  const frameText = document.querySelector('.hero-text');
  function fitFrame() {
    const availableHeight = frame.clientHeight * 0.64 - 8;
    const scale = Math.min(1, availableHeight / frameText.scrollHeight);
    frameText.style.setProperty('--copy-scale', String(scale));
  }
  fitFrame();
  if ('ResizeObserver' in window) {
    const frameObserver = new ResizeObserver(fitFrame);
    frameObserver.observe(frame);
    frameObserver.observe(frameText);
  }
  window.addEventListener('resize', fitFrame, { passive: true });
  if (document.fonts) document.fonts.ready.then(fitFrame);
  function updateCountdown() {
    const total = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const values = [Math.floor(total / 86400), Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60];
    ['days', 'hours', 'minutes', 'seconds'].forEach((id, i) => { el(id).textContent = String(values[i]).padStart(2, '0'); });
    if (!total) el('clock-caption').textContent = '¡Llegó el día de celebrar nuestro amor!';
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateCountdown(); });

  let toastTimeout;
  function toast(message) { el('toast').textContent = message; el('toast').classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => el('toast').classList.remove('visible'), 2600); }
  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) { try { await navigator.clipboard.writeText(value); return true; } catch (_) {} }
    const temp = document.createElement('textarea'); temp.value = value; temp.style.position = 'fixed'; temp.style.opacity = '0'; document.body.append(temp); temp.select(); temp.setSelectionRange(0, temp.value.length); let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) {} temp.remove(); return copied;
  }
  document.querySelectorAll('[data-copy]').forEach((button) => { button.addEventListener('click', async () => { toast(await copyText(button.dataset.copy) ? 'Copiado al portapapeles' : 'No se pudo copiar. Seleccioná el dato y copialo.'); }); });

  const form = el('rsvp-form');
  form.querySelectorAll('[name="attendance"]').forEach((radio) => radio.addEventListener('change', () => {
    const attending = form.elements.attendance.value === 'yes'; el('attending-fields').hidden = !attending;
    el('attending-fields').querySelectorAll('input, textarea').forEach((input) => input.disabled = !attending);
    el('form-status').textContent = ''; el('message-fallback').hidden = true;
  }));
  const number = String(config.whatsappNumber || '').replace(/\D/g, '');
  const connected = /^[1-9]\d{7,14}$/.test(number);
  if (!connected) { el('form-help').textContent = 'Las confirmaciones por WhatsApp estarán disponibles próximamente. Podés preparar y copiar tu respuesta.'; el('send-rsvp').textContent = 'Preparar mi respuesta'; }
  form.addEventListener('submit', (event) => {
    event.preventDefault(); if (!form.reportValidity()) return;
    const data = new FormData(form); const name = String(data.get('name') || '').trim();
    if (!name) { el('guest-name').setCustomValidity('Escribí tu nombre y apellido.'); el('guest-name').reportValidity(); return; }
    const yes = data.get('attendance') === 'yes';
    const lines = [`¡Hola! Respondo a la invitación de ${config.couple}.`, 'Boda: 19/12/2026', '', `Nombre: ${name}`, `Asistencia: ${yes ? 'Sí, voy a estar' : 'No podré asistir'}`];
    if (yes) {
  lines.push(
    `Alergias, preferencias o intolerancias: ${
      String(data.get('food') || '').trim() || 'Ninguna informada'
    }`
  );
}
    const message = lines.join('\n'); el('prepared-message').value = message; el('message-fallback').hidden = false;
    if (!connected) { el('form-status').textContent = 'Tu respuesta está preparada. El organizador todavía debe habilitar el número de WhatsApp.'; return; }
    // Navegación directa desde el toque: evita bloqueos de ventanas en Safari/iOS.
    // La respuesta se envía solo cuando el invitado toca Enviar dentro de WhatsApp.
    el('form-status').textContent = 'Tu respuesta está preparada. Enviála desde WhatsApp para confirmar.';
    window.location.assign(`https://wa.me/${number}?text=${encodeURIComponent(message)}`);
  });
  el('guest-name').addEventListener('input', () => el('guest-name').setCustomValidity(''));
  el('copy-message').addEventListener('click', async () => { toast(await copyText(el('prepared-message').value) ? 'Respuesta copiada' : 'Seleccioná tu respuesta y copiala.'); });

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } }), {threshold: 0.08});
    document.querySelectorAll('.reveal').forEach((section) => { section.classList.add('will-reveal'); observer.observe(section); });
  }
})();
