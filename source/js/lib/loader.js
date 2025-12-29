(function () {
  var loadScript = function (src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  };

  var loadStyle = function (href) {
    return new Promise(function (resolve, reject) {
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      l.onload = resolve;
      l.onerror = reject;
      document.head.appendChild(l);
    });
  };

  var whenReady = function (fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    }
  };

  var needHighlight = function () {
    var nodes = document.querySelectorAll("pre code");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var cls = n.className || "";
      if (cls.indexOf("mermaid") !== -1 || cls.indexOf("language-mermaid") !== -1) {
        continue;
      }
      if ((cls && cls.trim().length > 0) || (n.textContent && n.textContent.trim().length > 0)) {
        return true;
      }
    }
    return false;
  };

  var needMermaid = function () {
    return document.querySelector("code.mermaid, div.mermaid, pre code.language-mermaid") !== null;
  };

  var needMath = function () {
    if (!window.themeMathEnable) return false;
    var html = document.body.innerHTML;
    if (!html) return false;
    return html.indexOf("$$") !== -1 || html.indexOf("\\(") !== -1 || html.indexOf("\\)") !== -1;
  };

  var renderHighlight = function () {
    if (!window.hljs) return;
    var pres = document.querySelectorAll("pre");
    for (var i = 0; i < pres.length; i++) {
      var pre = pres[i];
      var codeText = pre.textContent;
      var classes = [];
      if (pre.firstChild && pre.firstChild.classList) {
        classes = Array.prototype.slice.call(pre.classList).concat(Array.prototype.slice.call(pre.firstChild.classList));
      } else {
        classes = Array.prototype.slice.call(pre.classList);
      }
      var language = classes[0] || "plaintext";
      if (classes.indexOf("mermaid") !== -1 || classes.indexOf("language-mermaid") !== -1) {
        continue;
      }
      var highlighted;
      try {
        highlighted = hljs.highlight(codeText, { language: language }).value;
      } catch (e) {
        highlighted = codeText;
      }
      pre.innerHTML = "\n                <div class=\"code-content hljs\">" + highlighted + "</div>\n                <div class=\"language\">" + language + "</div>\n                <div class=\"copycode\">\n                    <i class=\"fa-solid fa-copy fa-fw\"></i>\n                    <i class=\"fa-solid fa-check fa-fw\"></i>\n                </div>\n                ";
      if (hljs.lineNumbersBlock) {
        var content = pre.querySelector(".code-content");
        hljs.lineNumbersBlock(content, { singleLine: true });
      }
      (function (text, btn) {
        var copying = false;
        btn.addEventListener("click", function () {
          if (copying) return;
          copying = true;
          btn.classList.add("copied");
          navigator.clipboard.writeText(text).finally(function () {
            setTimeout(function () {
              btn.classList.remove("copied");
              copying = false;
            }, 1000);
          });
        });
      })(codeText, pre.querySelector(".copycode"));
    }
  };

  var renderMermaid = function () {
    if (!window.mermaid) return;
    try { mermaid.initialize({ startOnLoad: false, theme: "dark" }); } catch (e) {}
    var targets = document.querySelectorAll("code.mermaid, code.language-mermaid, div.mermaid");
    for (var ti = 0; ti < targets.length; ti++) {
      var t = targets[ti];
      var pre = t.closest ? t.closest("pre") : null;
      var codeText = t.textContent || "";
      var container = document.createElement("div");
      container.className = "mermaid-container";
      container.style.position = "relative";
      container.style.width = "100%";
      container.style.overflow = "hidden";
      container.style.textAlign = "center";
      container.style.background = "#282c34";
      container.style.borderRadius = "8px";
      container.style.margin = "20px 0";

      var mermaidEl = document.createElement("div");
      mermaidEl.style.transition = "transform 0.3s ease";
      mermaidEl.style.transformOrigin = "center center";

      var controls = document.createElement("div");
      controls.className = "mermaid-controls";
      controls.style.position = "absolute";
      controls.style.top = "10px";
      controls.style.right = "10px";
      controls.style.display = "flex";
      controls.style.gap = "5px";
      controls.style.zIndex = "100";
      controls.style.opacity = "0.3";
      controls.style.transition = "opacity 0.3s";

      var createBtn = function (iconClass, title, onClick) {
        var btn = document.createElement("button");
        btn.innerHTML = "<i class=\"" + iconClass + "\"></i>";
        btn.title = title;
        btn.style.background = "#444";
        btn.style.border = "1px solid #666";
        btn.style.color = "#fff";
        btn.style.cursor = "pointer";
        btn.style.padding = "6px 10px";
        btn.style.borderRadius = "4px";
        btn.style.fontSize = "14px";
        btn.onclick = onClick;
        btn.onmouseenter = function () { btn.style.background = "#666"; };
        btn.onmouseleave = function () { btn.style.background = "#444"; };
        return btn;
      };

      var scale = 1;
      var translateX = 0, translateY = 0;
      var applyTransform = function () {
        mermaidEl.style.transform = "translate(" + translateX + "px, " + translateY + "px) scale(" + scale + ")";
      };
      controls.appendChild(createBtn("fa-solid fa-magnifying-glass-plus", "放大", function () { scale += 0.2; applyTransform(); }));
      controls.appendChild(createBtn("fa-solid fa-magnifying-glass-minus", "缩小", function () { if (scale > 0.4) scale -= 0.2; applyTransform(); }));
      controls.appendChild(createBtn("fa-solid fa-rotate-right", "重置", function () { scale = 1; translateX = 0; translateY = 0; applyTransform(); }));
      controls.appendChild(createBtn("fa-solid fa-expand", "全屏", function () {
        if (!document.fullscreenElement) {
          container.requestFullscreen && container.requestFullscreen();
          container.style.display = "flex";
          container.style.alignItems = "center";
          container.style.justifyContent = "center";
          mermaidEl.style.width = "100%";
        } else { document.exitFullscreen && document.exitFullscreen(); }
      }));
      document.addEventListener("fullscreenchange", function () {
        if (!document.fullscreenElement) {
          container.style.display = "block";
          mermaidEl.style.width = "auto";
          scale = 1; translateX = 0; translateY = 0; applyTransform();
        }
      });
      var dragging = false, startX = 0, startY = 0;
      mermaidEl.style.cursor = "grab";
      container.addEventListener("mousedown", function (e) {
        if (controls.contains(e.target)) return;
        dragging = true; startX = e.clientX; startY = e.clientY;
        mermaidEl.style.cursor = "grabbing"; document.body.style.userSelect = "none";
      });
      document.addEventListener("mousemove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX; var dy = e.clientY - startY;
        startX = e.clientX; startY = e.clientY; translateX += dx; translateY += dy; applyTransform();
      });
      document.addEventListener("mouseup", function () { if (!dragging) return; dragging = false; mermaidEl.style.cursor = "grab"; document.body.style.userSelect = "auto"; });

      container.appendChild(mermaidEl);
      container.appendChild(controls);
      container.onmouseenter = function () { controls.style.opacity = "1"; };
      container.onmouseleave = function () { controls.style.opacity = "0"; };

      // 注入到页面
      if (pre) { pre.replaceWith(container); } else { t.parentElement.insertBefore(container, t); container.appendChild(t); }

      // 使用 mermaid.render 渲染
      try {
        var id = "mermaid-" + ti + "-" + Date.now();
        mermaid.render(id, codeText).then(function (res) {
          mermaidEl.innerHTML = res.svg || "";
          if (res.bindFunctions) { try { res.bindFunctions(mermaidEl); } catch (e) {} }
        }).catch(function () {
          // 失败兜底：保留原文本
          mermaidEl.textContent = codeText;
          mermaidEl.className = "mermaid";
        });
      } catch (e) {
        mermaidEl.textContent = codeText; mermaidEl.className = "mermaid";
      }
    }
  };

  var init = function () {
    whenReady(async function () {
      if (window.themeHighlightEnable && needHighlight()) {
        await loadStyle("/static/css/highlight.min.css");
        await loadScript("/static/js/highlight.min.js");
        await loadScript("/static/js/highlightjs-line-numbers.min.js");
        renderHighlight();
      }
      if (window.themeMermaidEnable && needMermaid()) {
        await loadScript("/static/js/mermaid.min.js");
        renderMermaid();
      }
      if (needMath()) {
        await loadStyle("/static/css/katex.min.css");
        await loadScript("/static/js/katex.min.js");
        await loadScript("/static/js/katex-auto-render.min.js");
        if (window.renderMathInElement) {
          try {
            window.renderMathInElement(document.body, { delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false },
              { left: "\\(", right: "\\)", display: false },
              { left: "\\[", right: "\\]", display: true },
            ] });
          } catch (e) {}
        }
      }

      // 监听后续DOM变更，增量渲染
      var throttle = function (fn, wait) {
        var ticking = false;
        return function () {
          if (ticking) return;
          ticking = true;
          setTimeout(function () { ticking = false; fn(); }, wait);
        };
      };
      var onMutate = throttle(function () {
        if (window.themeHighlightEnable && needHighlight() && window.hljs) {
          renderHighlight();
        }
        if (window.themeMermaidEnable && needMermaid() && window.mermaid) {
          renderMermaid();
        }
      }, 300);
      try {
        var mo = new MutationObserver(onMutate);
        mo.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}
    });
  };

  window.Loader = { loadScript: loadScript, loadStyle: loadStyle, init: init };
  init();
})();
