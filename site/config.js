/*
 * ─────────────────────────────────────────────────────────────
 *  THIS IS THE ONLY FILE YOU NEED TO EDIT.
 *
 *  Change the values below, reload, done. Both pages pick them up.
 * ─────────────────────────────────────────────────────────────
 */
window.SITE = {
  // Your business name. Appears in the nav, the footer and the page title.
  brand: "Expiry",

  // Your name, as it appears in the "who are you" answer.
  founder: "Soham Vishal Seth",

  // Your patch. Change this if you are not in Greater Manchester.
  town: "Greater Manchester",

  // Who you sell to.
  niche: "letting agents",

  // Your price. The page reads "£<perProperty> per property, per month".
  perProperty: 1,
  minMonthly: 99,

  // Where enquiries go.
  email: "soham.v.seth@gmail.com",

  // Optional. Paste a Cal.com / Calendly link and every "book" button goes there.
  bookingUrl: "",

  // Optional. Paste a Stripe Payment Link. Leave blank until you have one.
  paymentUrl: ""
};

(function () {
  "use strict";

  function boot() {
    var S = window.SITE;
    if (!S) return;

    function fill(attr, value) {
      if (value === undefined || value === null || value === "") return;
      var nodes = document.querySelectorAll("[data-cfg='" + attr + "']");
      for (var i = 0; i < nodes.length; i++) nodes[i].textContent = value;
    }

    function link(attr, href) {
      if (!href) return;
      var nodes = document.querySelectorAll("[data-cfg-link='" + attr + "']");
      for (var i = 0; i < nodes.length; i++) nodes[i].href = href;
    }

    fill("brand", S.brand);
    fill("founder", S.founder);
    fill("town", S.town);
    fill("niche", S.niche);
    fill("price", "£" + S.perProperty);
    fill("min", "£" + S.minMonthly);
    fill("email", S.email);

    link("email", "mailto:" + S.email);
    link("booking", S.bookingUrl || (S.email ? "mailto:" + S.email : ""));

    // Page titles read "Brand — rest of the original title".
    var parts = document.title.split("—");
    if (parts.length > 1 && S.brand) {
      document.title = S.brand + " —" + parts.slice(1).join("—");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
