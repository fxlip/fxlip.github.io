---
layout: default
title: "conectando..."
permalink: /auth/callback
hide_header: true
hide_footer: true
---

<div class="terminal-box" id="auth-terminal">
  <div class="terminal-header">
    <div class="terminal-controls">
      <div class="win-btn btn-min">−</div>
      <div class="win-btn btn-close">✕</div>
    </div>
  </div>
  <div class="terminal-body">
    <div><span class="t-user">fxlip</span><span class="t-gray">@</span><span class="t-host">www</span><span class="t-gray">:</span><span class="t-path">~/auth</span><span class="t-gray">$</span> <span class="t-cmd">./oauth-connect.sh <span id="auth-provider-arg"></span></span></div>
    <div id="auth-output"></div>
  </div>
</div>

<script defer src="{{ '/assets/js/auth-callback.js' | relative_url }}"></script>
