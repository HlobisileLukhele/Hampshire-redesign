/* Hampshire Hotel HTI BookNow integration */
(function () {
  "use strict";

  var bookingConfig = {
    siteId: 218,
    elementId: "booknow",
    apiUrl: "https://nebulacrs.hti.app/apollo3/eres/admin/direct",
    key: "-Nw8jO3FKE0nBC3JUI6X",
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

  function createMobileBookingSnackbar(container) {
    var existing = document.getElementById("bookingSnackbar");
    if (existing) return existing.__showBookingMessage;

    var snackbar = document.createElement("div");
    var dismissTimer;
    var hideTimer;

    snackbar.className = "booking-snackbar";
    snackbar.id = "bookingSnackbar";
    snackbar.hidden = true;
    snackbar.setAttribute("role", "status");
    snackbar.setAttribute("aria-live", "polite");
    snackbar.innerHTML =
      '<span class="booking-snackbar__message">' +
      '<span class="booking-snackbar__heading">' +
      '<span class="booking-snackbar__icon" aria-hidden="true">&#10003;</span>' +
      "Added to cart" +
      "</span>" +
      '<span class="booking-snackbar__copy">Your room has been added to your cart.</span>' +
      '<span class="booking-snackbar__actions">' +
      '<button class="booking-snackbar__checkout" type="button">Proceed to checkout <span aria-hidden="true">&#8594;</span></button>' +
      '<button class="booking-snackbar__dismiss" type="button">Dismiss</button>' +
      "</span>" +
      "</span>" +
      '<button class="booking-snackbar__close" type="button" aria-label="Dismiss confirmation">&times;</button>';

    function hideSnackbar() {
      window.clearTimeout(dismissTimer);
      snackbar.classList.remove("is-visible");
      hideTimer = window.setTimeout(function () {
        snackbar.hidden = true;
      }, 220);
    }

    function showSnackbar() {
      if (!window.matchMedia("(max-width: 768px)").matches) return;

      window.clearTimeout(dismissTimer);
      window.clearTimeout(hideTimer);
      snackbar.hidden = false;
      window.requestAnimationFrame(function () {
        snackbar.classList.add("is-visible");
      });
      dismissTimer = window.setTimeout(hideSnackbar, 6000);
    }

    function findCheckoutControl() {
      var controls = container.querySelectorAll("a, button, [role='button']");
      var checkoutPattern = /checkout|continue to (?:booking|payment)|guest details|payment details/i;
      var index;

      for (index = 0; index < controls.length; index += 1) {
        if (checkoutPattern.test(controls[index].textContent || "")) return controls[index];
      }

      return null;
    }

    function continueToCheckout() {
      var checkoutControl = findCheckoutControl();
      var mobileSummary;
      var summaryControl;

      hideSnackbar();
      if (checkoutControl) {
        checkoutControl.click();
        return;
      }

      mobileSummary = container.querySelector(".bn-itinerary-mobile-summary, .bn-itinerary-mobile");
      if (!mobileSummary) return;

      summaryControl = mobileSummary.querySelector("a, button, [role='button']") || mobileSummary;
      if (typeof summaryControl.click === "function") summaryControl.click();
    }

    snackbar.querySelector(".booking-snackbar__checkout").addEventListener("click", continueToCheckout);
    snackbar.querySelector(".booking-snackbar__dismiss").addEventListener("click", hideSnackbar);
    snackbar.querySelector(".booking-snackbar__close").addEventListener("click", hideSnackbar);
    snackbar.__showBookingMessage = showSnackbar;
    document.body.appendChild(snackbar);
    return showSnackbar;
  }

  function setupMobileRoomAddedNotice(container) {
    var showSnackbar = createMobileBookingSnackbar(container);

    container.addEventListener("click", function (event) {
      var target = event.target;
      var button = target && target.closest ? target.closest(".bn-booknow-button") : null;

      if (!button || !/book now/i.test(button.textContent || "")) return;
      showSnackbar();
    });
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
    setupMobileRoomAddedNotice(container);

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
