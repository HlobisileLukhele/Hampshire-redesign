/* Hampshire Hotel HTI BookNow integration */
(function () {
  "use strict";

  var bookingConfig = {
    siteId: 218,
    elementId: "booknow",
    key: "-Nw8jO3FKE0nBC3JUI6X",
    autoSearch: true,
    singleProperty: true,
    connectionCode: "BOOKNOW"
  };

  function getBookingSearch() {
    var params = new URLSearchParams(window.location.search);
    var search = {
      checkIn: params.get("checkIn"),
      checkOut: params.get("checkOut"),
      guests: params.get("guests"),
      rooms: params.get("rooms")
    };

    if (!search.checkIn || !search.checkOut || search.checkOut <= search.checkIn) {
      try {
        search = JSON.parse(window.sessionStorage.getItem("hampshireBookingSearch")) || {};
      } catch (error) {
        search = {};
      }
    }

    return search;
  }

  function showBookingSearch(search) {
    var summary = document.getElementById("bookingSearchSummary");
    if (!summary || !search.checkIn || !search.checkOut) return;

    var formatDate = function (value) {
      return new Date(value + "T00:00:00").toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    };

    summary.textContent =
      "Requested stay: " + formatDate(search.checkIn) + " to " + formatDate(search.checkOut) +
      " · " + (search.guests || "1") + " guest(s) · " + (search.rooms || "1") + " room(s).";
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
