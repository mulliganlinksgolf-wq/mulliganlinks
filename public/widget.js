(function () {
  var script = document.currentScript;
  if (!script) return;

  var course = script.getAttribute('data-course');
  if (!course) {
    console.warn('[TeeAhead] Missing data-course attribute on widget script tag.');
    return;
  }

  if (!script.parentNode) {
    console.warn('[TeeAhead] Widget script tag has no parent node.');
    return;
  }

  var iframe = document.createElement('iframe');
  iframe.src = 'https://app.teeahead.com/book/' + encodeURIComponent(course);
  iframe.style.cssText = 'width:100%;height:680px;border:none;display:block;border-radius:12px;';
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('title', 'Book Tee Times');

  script.parentNode.replaceChild(iframe, script);
})();
