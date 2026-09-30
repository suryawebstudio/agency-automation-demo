import { supabase } from './src/supabase.js';

const BUTTON_ID = 'leadflow-account-button';
const MODAL_ID = 'leadflow-password-modal';

function injectStyles() {
  if (document.getElementById('leadflow-account-styles')) return;
  const style = document.createElement('style');
  style.id = 'leadflow-account-styles';
  style.textContent = `
    #${BUTTON_ID}{cursor:pointer}
    #${MODAL_ID}{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,14,24,.58);backdrop-filter:blur(4px)}
    #${MODAL_ID} .lfp-card{width:min(440px,100%);background:#fff;border:1px solid #e5e9f0;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.22);padding:24px;color:#172033;font-family:inherit}
    #${MODAL_ID} h2{margin:0 0 8px;font-size:22px}
    #${MODAL_ID} p{margin:0 0 18px;color:#667085;font-size:14px;line-height:1.5}
    #${MODAL_ID} label{display:block;margin:12px 0 6px;font-size:13px;font-weight:700;color:#344054}
    #${MODAL_ID} input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #d7dde7;border-radius:9px;font:inherit;outline:none}
    #${MODAL_ID} input:focus{border-color:#172033;box-shadow:0 0 0 3px rgba(23,32,51,.08)}
    #${MODAL_ID} .lfp-actions{display:flex;gap:10px;margin-top:20px}
    #${MODAL_ID} button{border:0;border-radius:9px;padding:11px 15px;font:inherit;font-weight:700;cursor:pointer}
    #${MODAL_ID} .lfp-save{background:#172033;color:#fff;flex:1}
    #${MODAL_ID} .lfp-cancel{background:#eef1f5;color:#172033}
    #${MODAL_ID} button:disabled{opacity:.6;cursor:not-allowed}
    #${MODAL_ID} .lfp-msg{margin-top:14px;padding:10px 12px;border-radius:9px;font-size:13px;line-height:1.4}
    #${MODAL_ID} .lfp-error{background:#fff0f0;color:#b42318}
    #${MODAL_ID} .lfp-success{background:#ecfdf3;color:#027a48}
    @media(max-width:700px){#${MODAL_ID}{padding:12px}#${MODAL_ID} .lfp-card{padding:20px}}
  `;
  document.head.appendChild(style);
}

function closeModal() {
  document.getElementById(MODAL_ID)?.remove();
}

function openPasswordModal(email) {
  closeModal();
  injectStyles();

  const modal = document.createElement('div');
  modal.id = MODAL_ID;
  modal.innerHTML = `
    <section class="lfp-card" role="dialog" aria-modal="true" aria-labelledby="lfp-title">
      <h2 id="lfp-title">Change password</h2>
      <p>Update the password for <strong>${escapeHtml(email || 'your account')}</strong>. Your password is handled by Supabase Authentication and is never stored in this app.</p>
      <form id="lfp-form">
        <label for="lfp-new-password">New password</label>
        <input id="lfp-new-password" type="password" minlength="8" autocomplete="new-password" placeholder="At least 8 characters" required />
        <label for="lfp-confirm-password">Confirm new password</label>
        <input id="lfp-confirm-password" type="password" minlength="8" autocomplete="new-password" placeholder="Enter it again" required />
        <div class="lfp-actions">
          <button type="button" class="lfp-cancel" id="lfp-cancel">Cancel</button>
          <button type="submit" class="lfp-save" id="lfp-save">Save password</button>
        </div>
        <div id="lfp-message" hidden></div>
      </form>
    </section>
  `;

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.body.appendChild(modal);

  const form = modal.querySelector('#lfp-form');
  const newPassword = modal.querySelector('#lfp-new-password');
  const confirmPassword = modal.querySelector('#lfp-confirm-password');
  const saveButton = modal.querySelector('#lfp-save');
  const message = modal.querySelector('#lfp-message');

  modal.querySelector('#lfp-cancel').addEventListener('click', closeModal);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.hidden = true;

    if (newPassword.value.length < 8) {
      showMessage(message, 'Password must be at least 8 characters.', false);
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      showMessage(message, 'The passwords do not match.', false);
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Saving…';

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      showMessage(message, 'Your session has expired. Please log in again.', false);
      saveButton.disabled = false;
      saveButton.textContent = 'Save password';
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword.value });
    if (error) {
      showMessage(message, error.message, false);
    } else {
      form.reset();
      showMessage(message, 'Password changed successfully. Use the new password next time you log in.', true);
    }

    saveButton.disabled = false;
    saveButton.textContent = 'Save password';
  });

  newPassword.focus();
}

function showMessage(element, text, success) {
  element.hidden = false;
  element.className = `lfp-msg ${success ? 'lfp-success' : 'lfp-error'}`;
  element.textContent = text;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

async function isAuthorizedSession() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data: member, error } = await supabase
    .from('team_members')
    .select('email,role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !member) return null;
  return { user, member };
}

async function addAccountButton() {
  const nav = document.querySelector('header nav');
  if (!nav || document.getElementById(BUTTON_ID)) return;

  const account = await isAuthorizedSession();
  if (!account) return;

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.textContent = 'Account';
  button.title = 'Change your password';
  button.addEventListener('click', () => openPasswordModal(account.member.email || account.user.email));

  const logoutButton = [...nav.querySelectorAll('button')].find((item) => item.textContent.trim().toLowerCase() === 'log out');
  if (logoutButton) nav.insertBefore(button, logoutButton);
  else nav.appendChild(button);
}

function watchApp() {
  injectStyles();
  addAccountButton();
  const observer = new MutationObserver(() => addAccountButton());
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', watchApp, { once: true });
} else {
  watchApp();
}
