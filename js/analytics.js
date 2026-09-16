/* Google Tag Manager loader kept external so the site's CSP can disallow inline scripts. */
(function (windowObject, documentObject, tagName, dataLayerName, containerId) {
  windowObject[dataLayerName] = windowObject[dataLayerName] || [];
  windowObject[dataLayerName].push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js"
  });

  var firstScript = documentObject.getElementsByTagName(tagName)[0];
  var tagScript = documentObject.createElement(tagName);
  var dataLayerParameter = dataLayerName !== "dataLayer" ? "&l=" + dataLayerName : "";

  tagScript.async = true;
  tagScript.src = "https://www.googletagmanager.com/gtm.js?id=" + containerId + dataLayerParameter;
  firstScript.parentNode.insertBefore(tagScript, firstScript);
})(window, document, "script", "dataLayer", "GTM-PDRLTQWM");
