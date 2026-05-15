const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,

    icon: path.join(__dirname, "assets", "icon.png"),

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },

    autoHideMenuBar: true, // cleaner app UI
  });

  // Load your Vercel site
  win.loadURL("https://dms-five-pied.vercel.app/");

  // Open external links in browser instead of inside app
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Prevent navigating away from your app domain
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("https://dms-five-pied.vercel.app/")) {
      event.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});