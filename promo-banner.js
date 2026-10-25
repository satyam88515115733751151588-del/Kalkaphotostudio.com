(function () {
  var SHOP_URL = "/contact.html"; // change this to your shop page link

  var css = `
    #promo-bar{position:fixed;top:0;left:0;right:0;z-index:99999;
      background:linear-gradient(90deg,#7a1f1f,#b8860b,#7a1f1f);
      color:#fff;text-align:center;padding:9px 14px;
      font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      letter-spacing:.2px;box-shadow:0 2px 8px rgba(0,0,0,.25)}
    #promo-bar a{color:#fff;text-decoration:underline;font-weight:700}
    #promo-bar span{opacity:.9;font-weight:500}
    @media(max-width:600px){#promo-bar{font-size:12.5px;padding:8px 10px}
      #promo-bar span{display:block}}
  `;

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var bar = document.createElement("div");
  bar.id = "promo-bar";
  bar.innerHTML =
    '🎉 <a href="' + SHOP_URL + '">Visit our shop today</a> and get festive discounts! ' +
    '<span>Less price, yet better quality than others.</span>';
  document.body.insertBefore(bar, document.body.firstChild);

  // Push page content (and your existing fixed/sticky menu) below the banner
  function adjust() {
    var h = bar.offsetHeight;
    document.body.style.paddingTop = h + "px";
    document.querySelectorAll("header, nav, body > *").forEach(function (el) {
      if (el === bar) return;
      var pos = getComputedStyle(el).position;
      if (pos === "fixed" || pos === "sticky") {
        el.style.top = h + "px";
      }
    });
  }
  adjust();
  window.addEventListener("resize", adjust);
  window.addEventListener("load", adjust);
})();
