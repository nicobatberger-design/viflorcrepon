/* ViflorCrepon — Microsoft Clarity (heatmaps + rejeu de session anonymise).
   Charge UNIQUEMENT apres consentement via la banniere existante (cle localStorage
   vfc_cookie_consent). CLARITY_ID vide = script totalement inactif.
   ID a recuperer sur clarity.microsoft.com > projet ViflorCrepon > Settings > Project ID. */
(function () {
  "use strict";

  var CLARITY_ID = "xot3y8lhe2"; // ID projet Clarity "ViflorCrepon" (clarity.microsoft.com)
  var KEY = "vfc_cookie_consent";

  if (!CLARITY_ID) return;

  function loadClarity() {
    if (window.clarity) return;
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.clarity.ms/tag/" + CLARITY_ID;
    document.head.appendChild(s);
  }

  var consent = null;
  try { consent = localStorage.getItem(KEY); } catch (e) {}
  if (consent === "accepted") loadClarity();

  // Si la page porte la banniere : charger Clarity des que l'utilisateur accepte
  if (typeof window.cookieAccept === "function") {
    var orig = window.cookieAccept;
    window.cookieAccept = function () { orig(); loadClarity(); };
  }
})();
