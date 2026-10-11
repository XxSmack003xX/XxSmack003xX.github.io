/* Keeps the page current: the latest MEDIARR release, its date and download link come
   from the GitHub API. If that request fails, the version written into the page stays. */
(function () {
  'use strict';
  var REPO = 'XxSmack003xX/MEDIARR';
  var fmt = function (iso) {
    try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return iso.slice(0, 10); }
  };
  var setAll = function (sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); };

  // Copy the start commands
  setAll('[data-copy]', function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.previousElementSibling, text = pre ? pre.innerText.trim() : '';
      var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });

  if (!window.fetch) return;
  fetch('https://api.github.com/repos/' + REPO + '/releases?per_page=6', { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (list) {
      list = (list || []).filter(function (r) { return !r.draft && !r.prerelease; });
      if (!list.length) return;
      var latest = list[0], tag = latest.tag_name, ver = tag.replace(/^v/, '');
      var zip = (latest.assets || []).find(function (a) { return /\.zip$/i.test(a.name); });
      var zipName = zip ? zip.name : 'mediarr-' + ver + '.zip';

      setAll('[data-version]', function (el) { el.textContent = tag; });
      setAll('[data-release-date]', function (el) { el.textContent = fmt(latest.published_at); });
      setAll('[data-release-link]', function (el) { el.href = latest.html_url; });
      setAll('[data-zip-name]', function (el) { el.textContent = zipName; });
      setAll('[data-zip-link]', function (el) { el.href = zip ? zip.browser_download_url : latest.html_url; });
      var dl = document.getElementById('downloadBtn'); if (dl && zip) dl.href = zip.browser_download_url;
      setAll('[data-unzip]', function (el) { el.textContent = 'unzip ' + zipName + '\ncd ' + zipName.replace(/\.zip$/i, ''); });

      // Recent releases: keep the hand-written summaries, add any newer versions.
      var ul = document.getElementById('releaseList'); if (!ul) return;
      var known = {};
      Array.prototype.forEach.call(ul.querySelectorAll('li'), function (li) {
        var t = li.querySelector('.tag'); if (t) known[t.textContent.trim()] = li.querySelector('p').textContent;
      });
      ul.innerHTML = '';
      list.slice(0, 3).forEach(function (r) {
        var li = document.createElement('li');
        var a = document.createElement('a'); a.href = r.html_url;
        var t = document.createElement('span'); t.className = 'tag'; t.textContent = r.tag_name;
        var d = document.createElement('time'); d.dateTime = r.published_at; d.textContent = fmt(r.published_at);
        a.appendChild(t); a.appendChild(d);
        var p = document.createElement('p');
        p.textContent = known[r.tag_name] || 'See what changed in the release notes on GitHub.';
        li.appendChild(a); li.appendChild(p); ul.appendChild(li);
      });
    })
    .catch(function () { /* offline or rate-limited: the static content stays */ });
})();
