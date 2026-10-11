console.log("[E-Cell] Google Meet helper initialized");function s(){var i;const e=window.location.pathname.match(/\/([a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3})/i),t=e?e[1]:"",n=document.querySelector('[data-meeting-title], [jsname="r4nke"], div[aria-label="Meeting details"]');let o=((i=n==null?void 0:n.textContent)==null?void 0:i.trim())||"";return!o&&t?o=`Google Meet (${t})`:o||(o="Google Meet Discussion"),{title:o,code:t}}function l(){if(document.getElementById("ecell-meet-pill"))return;const e=document.createElement("div");e.id="ecell-meet-pill",e.style.cssText=`
    position: fixed;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99999;
    background: #FAF8F5;
    border: 1px solid #DCD2BF;
    color: #191613;
    padding: 6px 14px;
    border-radius: 9999px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  `,e.innerHTML=`
    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#0F766E;"></span>
    <span>E-Cell: Use Meet Title in Notes</span>
  `,e.addEventListener("mouseenter",()=>{e.style.borderColor="#0F766E",e.style.boxShadow="0 6px 16px rgba(15,118,110,0.2)"}),e.addEventListener("mouseleave",()=>{e.style.borderColor="#DCD2BF",e.style.boxShadow="0 4px 12px rgba(0,0,0,0.15)"}),e.addEventListener("click",()=>{const{title:t}=s();try{chrome.runtime.sendMessage({type:"SET_MEETING_TITLE",title:t||"E-Cell Meet Sync",source:"meet"}),e.innerHTML=`
        <span style="color:#0F766E; font-size:12px;">✓</span>
        <span>Title Synced to Side Panel!</span>
      `,setTimeout(()=>{e.innerHTML=`
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#0F766E;"></span>
          <span>E-Cell: Use Meet Title in Notes</span>
        `},3e3)}catch(n){console.warn("[E-Cell Meet] Error:",n)}}),document.body.appendChild(e)}setTimeout(()=>{l(),setInterval(l,4e3)},3e3);
