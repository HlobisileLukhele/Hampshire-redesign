<!-- External  script -->
<script type="text/javascript" src="https://nebulacrs.hti.app/apollo3/booknow/static/js/booknow.js"></script>

<!-- Execution-->
<script type="text/javascript">
  // Ensure the DOM is fully loaded and the displayBookNow function exists
  window.addEventListener('DOMContentLoaded', function() {
    if (typeof displayBookNow === 'function') {
      displayBookNow({
        siteId: 218,
        elementId: 'booknow',
        key: '-Nw8jO3FKE0nBC3JUI6X', 
        autoSearch: true,
        singleProperty: true,
        connectionCode: 'BOOKNOW'
      });
    } else {
      console.error('displayBookNow function is not defined. Check if booknow.js loaded correctly.');
    }
  });
</script>