/* Hampshire Hotel HTI BookNow test integration */
(function () {
  "use strict";

  var bookingConfig = {
    siteId: 5,
    elementId: "booknow",
    apiUrl: "https://test.hti.app/htitest/eres/admin/direct",
    autoSearch: true,
    singleProperty: true,
    connectionCode: "BOOKNOW"
  };

  function getBookingSearch() {
    var hash = window.location.hash || "";
    var queryStart = hash.indexOf("?");
    var params = new URLSearchParams(queryStart === -1 ? "" : hash.slice(queryStart + 1));
    var childAges = [];

    try {
      childAges = JSON.parse(params.get("children") || "[]");
    } catch (error) {
      childAges = [];
    }

    return {
      arrivalDate: params.get("arrivalDate"),
      departDate: params.get("departDate"),
      adults: params.get("adults"),
      childAges: childAges
    };
  }

  function showBookingSearch(search) {
    var summary = document.getElementById("bookingSearchSummary");
    if (!summary || !search.arrivalDate || !search.departDate) return;

    var formatDate = function (value) {
      return new Date(value + "T00:00:00").toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    };
    var adultCount = search.adults || "1";
    var childCount = search.childAges.length;
    var childText = childCount ? " and " + childCount + (childCount === 1 ? " child" : " children") : "";

    summary.textContent =
      "Requested stay: " + formatDate(search.arrivalDate) + " to " + formatDate(search.departDate) +
      " for " + adultCount + (adultCount === "1" ? " adult" : " adults") + childText + ".";
    summary.hidden = false;
  }

  function showBookingUnavailable(container) {
    container.removeAttribute("aria-busy");
    container.innerHTML =
      '<div class="booknow-fallback" role="status">' +
      "<h2>Online booking is temporarily unavailable</h2>" +
      "<p>Please try again shortly, or contact our reservations team for help with your stay.</p>" +
      '<a class="btn btn-primary" href="contact.html">Contact reservations</a>' +
      "</div>";
  }

  function watchForProviderError(container) {
    var observer = new MutationObserver(function () {
      var message = (container.textContent || "").toLowerCase();
      if (message.indexOf("site not loaded") !== -1 || message.indexOf("contact support") !== -1) {
        observer.disconnect();
        showBookingUnavailable(container);
      }
    });

    observer.observe(container, { childList: true, subtree: true, characterData: true });
    window.setTimeout(function () { observer.disconnect(); }, 10000);
  }

  function initialiseBookNow() {
    var container = document.getElementById(bookingConfig.elementId);
    if (!container) return;

    showBookingSearch(getBookingSearch());

    if (typeof window.displayBookNow !== "function") {
      showBookingUnavailable(container);
      return;
    }

    try {
      watchForProviderError(container);
      window.displayBookNow(bookingConfig);
      container.removeAttribute("aria-busy");
    } catch (error) {
      showBookingUnavailable(container);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseBookNow);
  } else {
    initialiseBookNow();
  }
})();
