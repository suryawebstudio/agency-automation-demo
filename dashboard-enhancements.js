import { supabase } from './src/supabase.js';

const BUTTON_ID = 'leadflow-account-button';
const MODAL_ID = 'leadflow-password-modal';
const FORGOT_ID = 'leadflow-forgot-password';
const RECOVERY_ID = 'leadflow-recovery-modal';
const SITE_URL = 'https://agency-automation-demo.pages.dev';

function injectStyles() {
  if (document.getElementById('leadflow-account-styles')) return;
  const style = document.createElement('style');
  style.id = 'leadflow-account-styles';
  style.textContent = `
    #${BUTTON_ID}{cursor:pointer}
    #${FORGOT_ID}{display:block;margin:14px auto 0;border:0;background:transparent;color:#475467;text-decoration:underline;cursor:pointer;font:inherit;font-size:13px}
    #${MODAL_ID},#${RECOVERY_ID}{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,14,24,.58);backdrop-filter:blur(4px)}
    #${MODAL_ID} .lfp-card,#${RECOVERY_ID} .lfp-card{width:min(440px,100%);background:#fff;border:1px solid #e5e9f0;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.22);padding:24px;color:#172033;font-family:inherit}
    #${MODAL_ID} h2,#${RECOVERY_ID} h2{margin:0 0 8px;font-size:22px}
    #${MODAL_ID} p,#${RECOVERY_ID} p{margin:0 0 18px;color:#667085;font-size:14px;line-height:1.5}
    #${MODAL_ID} label,#${RECOVERY_ID} label{display:block;margin:12px 0 6px;font-size:13px;font-weight:700;color:#344054}
    #${MODAL_ID} input,#${RECOVERY_ID} input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #d7dde7;border-radius:9px;font:inherit;outline:none}
    #${MODAL_ID} input:focus,#${RECOVERY_ID} input:focus{border-color:#172033;box-shadow:0 0 0 3px rgba(23,32,51,.08)}
    #${MODAL_ID} .lfp-actions,#${RECOVERY_ID} .lfp-actions{display:flex;gap:10px;margin-top:20px}
    #${MODAL_ID} button,#${RECOVERY_ID} button{border:0;border-radius:9px;padding:11px 15px;font:inherit;font-weight:700;cursor:pointer}
    #${MODAL_ID} .lfp-save,#${RECOVERY_ID} .lfp-save{background:#172033;color:#fff;flex:1}
    #${MODAL_ID} .lfp-cancel,#${RECOVERY_ID} .lfp-cancel{background:#eef1f5;color:#172033}
    #${MODAL_ID} button:disabled,#${RECOVERY_ID} button:disabled{opacity:.6;cursor:not-allowed}
    #${MODAL_ID} .lfp-msg,#${RECOVERY_ID} .lfp-msg{margin-top:14px;padding:10px 12px;border-radius:9px;font-size:13px;line-height:1.4}
    #${MODAL_ID} .lfp-error,#${RECOVERY_ID} .lfp-error{background:#fff0f0;color:#b42318}
    #${MODAL_ID} .lfp-success,#${RECOVERY_ID} .lfp-success{background:#ecfdf3;color:#027a48}
    @media(max-width:700px){#${MODAL_ID},#${RECOVERY_ID}{padding:12px}#${MODAL_ID} .lfp-card,#${RECOVERY_ID} .lfp-card{padding:20px}}
  `;
  document.head.appendChild(style);
}

function closeModal(id) { document.getElementById(id)?.remove(); }

function showMessage(element, text, success) {
  element.hidden = false;
  element.className = `lfp-msg ${success ? 'lfp-success' : 'lfp-error'}`;
  element.textContent = text;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function openPasswordModal(email) {
  closeModal(MODAL_ID);
  injectStyles();
  const modal = document.createElement('div');
  modal.id = MODAL_ID;
  modal.innerHTML = `<section class="lfp-card" role="dialog" aria-modal="true"><h2>Change password</h2><p>Update the password for <strong>${escapeHtml(email || 'your account')}</strong>. Your password is handled by Supabase Authentication.</p><form id="lfp-form"><label>New password</label><input id="lfp-new-password" type="password" minlength="8" autocomplete="new-password" placeholder="At least 8 characters" required /><label>Confirm new password</label><input id="lfp-confirm-password" type="password" minlength="8" autocomplete="new-password" placeholder="Enter it again" required /><div class="lfp-actions"><button type="button" class="lfp-cancel" id="lfp-cancel">Cancel</button><button type="submit" class="lfp-save" id="lfp-save">Save password</button></div><div id="lfp-message" hidden></div></form></section>`;
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(MODAL_ID); });
  document.body.appendChild(modal);
  const form=modal.querySelector('#lfp-form'), np=modal.querySelector('#lfp-new-password'), cp=modal.querySelector('#lfp-confirm-password'), save=modal.querySelector('#lfp-save'), msg=modal.querySelector('#lfp-message');
  modal.querySelector('#lfp-cancel').addEventListener('click',()=>closeModal(MODAL_ID));
  form.addEventListener('submit',async e=>{e.preventDefault();msg.hidden=true;if(np.value.length<8)return showMessage(msg,'Password must be at least 8 characters.',false);if(np.value!==cp.value)return showMessage(msg,'The passwords do not match.',false);save.disabled=true;save.textContent='Saving…';const {error}=await supabase.auth.updateUser({password:np.value});if(error)showMessage(msg,error.message,false);else{form.reset();showMessage(msg,'Password changed successfully.',true)}save.disabled=false;save.textContent='Save password';});
  np.focus();
}

function openRecoveryModal() {
  closeModal(RECOVERY_ID);
  injectStyles();
  const modal=document.createElement('div');modal.id=RECOVERY_ID;
  modal.innerHTML=`<section class="lfp-card" role="dialog" aria-modal="true"><h2>Set a new password</h2><p>Choose a new password for your CRM account.</p><form id="lfr-form"><label>New password</label><input id="lfr-new" type="password" minlength="8" autocomplete="new-password" placeholder="At least 8 characters" required /><label>Confirm new password</label><input id="lfr-confirm" type="password" minlength="8" autocomplete="new-password" placeholder="Enter it again" required /><div class="lfp-actions"><button type="submit" class="lfp-save" id="lfr-save">Update password</button></div><div id="lfr-message" hidden></div></form></section>`;
  document.body.appendChild(modal);
  const form=modal.querySelector('#lfr-form'),np=modal.querySelector('#lfr-new'),cp=modal.querySelector('#lfr-confirm'),save=modal.querySelector('#lfr-save'),msg=modal.querySelector('#lfr-message');
  form.addEventListener('submit',async e=>{e.preventDefault();msg.hidden=true;if(np.value.length<8)return showMessage(msg,'Password must be at least 8 characters.',false);if(np.value!==cp.value)return showMessage(msg,'The passwords do not match.',false);save.disabled=true;save.textContent='Updating…';const {error}=await supabase.auth.updateUser({password:np.value});if(error){showMessage(msg,error.message,false);save.disabled=false;save.textContent='Update password';return}showMessage(msg,'Password updated. You can now log in with your new password.',true);setTimeout(()=>{closeModal(RECOVERY_ID);window.history.replaceState({},document.title,window.location.pathname);supabase.auth.signOut();},1200);});
  np.focus();
}

async function addForgotPassword() {
  if(document.getElementById(FORGOT_ID)) return;
  const form=document.querySelector('main form');
  if(!form) return;
  const password=form.querySelector('input[type="password"]');
  const email=form.querySelector('input[type="email"]');
  if(!password||!email) return;
  const button=document.createElement('button');button.id=FORGOT_ID;button.type='button';button.textContent='Forgot password?';
  button.addEventListener('click',async()=>{
    const address=email.value.trim().toLowerCase();
    if(!address){email.focus();email.setCustomValidity('Enter your email address first.');email.reportValidity();email.setCustomValidity('');return}
    button.disabled=true;button.textContent='Sending reset email…';
    const {error}=await supabase.auth.resetPasswordForEmail(address,{redirectTo:SITE_URL});
    if(error){button.textContent=error.message;button.style.color='#b42318';setTimeout(()=>{button.textContent='Forgot password?';button.style.color='';button.disabled=false},4000)}
    else{button.textContent='Reset email sent. Check your inbox.';button.style.textDecoration='none';setTimeout(()=>{button.textContent='Forgot password?';button.style.textDecoration='underline';button.disabled=false},6000)}
  });
  form.appendChild(button);
}

async function isAuthorizedSession() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;
  const { data: member, error } = await supabase.from('team_members').select('email,role').eq('user_id', user.id).maybeSingle();
  if (error || !member) return null;
  return { user, member };
}

async function addAccountButton() {
  const nav=document.querySelector('header nav');if(!nav||document.getElementById(BUTTON_ID))return;
  const account=await isAuthorizedSession();if(!account)return;
  const button=document.createElement('button');button.id=BUTTON_ID;button.type='button';button.textContent='Account';button.title='Change your password';button.addEventListener('click',()=>openPasswordModal(account.member.email||account.user.email));
  const logout=[...nav.querySelectorAll('button')].find(item=>item.textContent.trim().toLowerCase()==='log out');if(logout)nav.insertBefore(button,logout);else nav.appendChild(button);
}

async function watchApp() {
  injectStyles();
  const hash=window.location.hash;
  const recovery=hash.includes('type=recovery') || hash.includes('access_token=');
  if(recovery){setTimeout(()=>openRecoveryModal(),300);return;}
  addForgotPassword();
  addAccountButton();
  const observer=new MutationObserver(()=>{addForgotPassword();addAccountButton()});
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('beforeunload',()=>observer.disconnect(),{once:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchApp,{once:true});else watchApp();
