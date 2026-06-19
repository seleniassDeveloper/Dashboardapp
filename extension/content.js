// content.js
// Injected into localhost:5173/app/inventory

const LOCAL_IP = "192.168.0.9";
const SCANNER_URL = `http://${LOCAL_IP}:5173/scan.html`;
const QR_API = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(SCANNER_URL)}`;

// Create floating UI
const createUI = () => {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.zIndex = "999999";
  container.style.fontFamily = "sans-serif";

  // Floating Button
  const btn = document.createElement("button");
  btn.innerHTML = "📱 Conectar Móvil";
  btn.style.backgroundColor = "#4f46e5";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.borderRadius = "9999px";
  btn.style.padding = "12px 24px";
  btn.style.fontSize = "14px";
  btn.style.fontWeight = "bold";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
  btn.style.transition = "all 0.2s";

  // Modal Panel
  const panel = document.createElement("div");
  panel.style.display = "none";
  panel.style.position = "absolute";
  panel.style.bottom = "60px";
  panel.style.right = "0";
  panel.style.backgroundColor = "white";
  panel.style.padding = "20px";
  panel.style.borderRadius = "16px";
  panel.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
  panel.style.border = "1px solid #e2e8f0";
  panel.style.width = "290px";
  panel.style.textAlign = "center";

  panel.innerHTML = `
    <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1e293b;">Escáner Inalámbrico</h3>
    <p style="margin: 0 0 15px 0; font-size: 12px; color: #64748b;">Abre la cámara de tu celular y escanea este código para empezar a enviar productos al sistema.</p>
    <img src="${QR_API}" alt="QR Code" style="width: 250px; height: 250px; border-radius: 8px; margin-bottom: 15px;" />
    <p style="margin: 0; font-size: 11px; color: #94a3b8; font-family: monospace;">${SCANNER_URL}</p>
  `;

  btn.onclick = () => {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  };

  container.appendChild(panel);
  container.appendChild(btn);
  document.body.appendChild(container);
};

// Simulate React input change
const injectCodeIntoSearch = (code) => {
  const input = document.querySelector('input[placeholder*="Buscar insumos"]');
  if (!input) {
    console.warn("AuraDash Sync: Search input not found.");
    return;
  }

  // Set native value so React detects the change
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  nativeInputValueSetter.call(input, code);

  // Dispatch events for React
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));

  console.log(`AuraDash Sync: Injected code ${code}`);
  
  // Highlight input briefly
  const originalBg = input.style.backgroundColor;
  input.style.backgroundColor = "#e0e7ff";
  setTimeout(() => {
    input.style.backgroundColor = originalBg;
  }, 500);
};

// Polling loop
const startPolling = () => {
  setInterval(async () => {
    try {
      const res = await fetch("http://localhost:3001/api/mobile-scans/pending");
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.pending && data.pending.length > 0) {
        console.log("AuraDash Sync: Received codes", data.pending);
        
        // Inject codes one by one with a delay if there are multiple
        let delay = 0;
        data.pending.forEach((code) => {
          setTimeout(() => {
            injectCodeIntoSearch(code);
          }, delay);
          delay += 1000; // 1 second between codes so user can see them
        });
      }
    } catch (e) {
      // Ignore polling connection errors when backend is down
    }
  }, 2000);
};

// Initialize
setTimeout(() => {
  createUI();
  startPolling();
  console.log("AuraDash Scanner Sync Extension Loaded!");
}, 1000);
