console.log("[E-Cell] WhatsApp Web helper initialized");function x(){if(document.getElementById("ecell-wa-capture-btn"))return;const e=document.createElement("div");e.id="ecell-wa-capture-btn",e.style.cssText=`
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 99999;
    background: #0F766E;
    color: #FAF8F5;
    padding: 8px 14px;
    border-radius: 9999px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  `,e.innerHTML=`
    <span style="font-size: 14px;">📝</span>
    <span>Capture Chat to E-Cell</span>
  `,e.addEventListener("mouseenter",()=>{e.style.transform="scale(1.05)",e.style.background="#115E59"}),e.addEventListener("mouseleave",()=>{e.style.transform="scale(1)",e.style.background="#0F766E"}),e.addEventListener("click",()=>{m()}),document.body.appendChild(e)}function m(){var r;const e=(r=window.getSelection())==null?void 0:r.toString().trim();if(e){d(e,"whatsapp_capture"),i("Selected WhatsApp text captured to E-Cell!");return}const t=document.querySelectorAll("div[data-pre-plain-text], .message-in, .message-out"),n=[];if(t.length>0&&t.forEach(s=>{var p,c;const l=s.getAttribute("data-pre-plain-text")||"",o=s.querySelector(".selectable-text"),a=((p=o==null?void 0:o.textContent)==null?void 0:p.trim())||((c=s.textContent)==null?void 0:c.trim())||"";a&&(l?n.push(`${l}${a}`):n.push(a))}),n.length===0){i("Open a chat or highlight text to capture messages.");return}const u=n.join(`
`);d(u,"whatsapp_capture"),i(`Captured ${n.length} chat messages to E-Cell!`)}function d(e,t){try{chrome.runtime.sendMessage({type:"APPEND_TRANSCRIPT",text:e,source:t})}catch(n){console.warn("[E-Cell] Error sending message:",n)}}function i(e){const t=document.createElement("div");t.style.cssText=`
    position: fixed;
    bottom: 70px;
    right: 24px;
    z-index: 100000;
    background: #191613;
    color: #FAF8F5;
    padding: 8px 16px;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 11px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    pointer-events: none;
    transition: opacity 0.3s ease;
  `,t.textContent=e,document.body.appendChild(t),setTimeout(()=>{t.style.opacity="0",setTimeout(()=>t.remove(),300)},2500)}setInterval(x,2e3);
