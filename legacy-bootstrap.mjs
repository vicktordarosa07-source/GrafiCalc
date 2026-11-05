window.addEventListener("DOMContentLoaded", async () => {
  try {
    await window.grafiCalcLegacyAuthReady;
    const appScript = document.createElement("script");
    appScript.type = "module";
    appScript.src = "./app.mjs?v=20261105-creator-tabs";
    document.body.appendChild(appScript);
  } catch (error) {
    console.error("Nao foi possivel preparar a sessao do GrafiCalc.", error);
  }
});
