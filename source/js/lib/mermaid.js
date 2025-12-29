mixins.mermaid = {
    created() {
        if (window.mermaid) {
            mermaid.initialize({ startOnLoad: false, theme: "dark" });
            this.renderers.push(this.mermaid);
        }
    },
    methods: {
        mermaid() {
            // 同时支持 code.mermaid / code.language-mermaid / div.mermaid
            let targets = document.querySelectorAll("code.mermaid, code.language-mermaid, div.mermaid");
            for (let t of targets) {
                let pre = t.closest("pre");

                // 1. 创建容器
                let container = document.createElement("div");
                container.className = "mermaid-container";
                container.style.position = "relative";
                container.style.width = "100%";
                container.style.overflow = "hidden";
                container.style.textAlign = "center";
                container.style.background = "#282c34";
                container.style.borderRadius = "8px";
                container.style.margin = "20px 0";

                // 2. 确认渲染区域元素
                let mermaidEl;
                if (t.tagName.toLowerCase() === "div") {
                    mermaidEl = t;
                } else {
                    mermaidEl = document.createElement("div");
                    mermaidEl.className = "mermaid";
                    mermaidEl.textContent = t.textContent;
                }
                mermaidEl.style.transition = "transform 0.3s ease";
                mermaidEl.style.transformOrigin = "center center";

                // 3. 创建控制栏
                let controls = document.createElement("div");
                controls.className = "mermaid-controls";
                controls.style.position = "absolute";
                controls.style.top = "10px";
                controls.style.right = "10px";
                controls.style.display = "flex";
                controls.style.gap = "5px";
                controls.style.zIndex = "100";
                controls.style.opacity = "0.3";
                controls.style.transition = "opacity 0.3s";

                const createBtn = (iconClass, title, onClick) => {
                    let btn = document.createElement("button");
                    btn.innerHTML = `<i class=\"${iconClass}\"></i>`;
                    btn.title = title;
                    btn.style.background = "#444";
                    btn.style.border = "1px solid #666";
                    btn.style.color = "#fff";
                    btn.style.cursor = "pointer";
                    btn.style.padding = "6px 10px";
                    btn.style.borderRadius = "4px";
                    btn.style.fontSize = "14px";
                    btn.onclick = onClick;
                    btn.onmouseenter = () => btn.style.background = "#666";
                    btn.onmouseleave = () => btn.style.background = "#444";
                    return btn;
                };

                let scale = 1;
                let translateX = 0, translateY = 0;
                const applyTransform = () => {
                    mermaidEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
                };
                controls.appendChild(createBtn("fa-solid fa-magnifying-glass-plus", "放大", () => {
                    scale += 0.2;
                    applyTransform();
                }));
                controls.appendChild(createBtn("fa-solid fa-magnifying-glass-minus", "缩小", () => {
                    if (scale > 0.4) scale -= 0.2;
                    applyTransform();
                }));
                controls.appendChild(createBtn("fa-solid fa-rotate-right", "重置", () => {
                    scale = 1;
                    translateX = 0;
                    translateY = 0;
                    applyTransform();
                }));
                controls.appendChild(createBtn("fa-solid fa-expand", "全屏", () => {
                   if (!document.fullscreenElement) {
                       container.requestFullscreen().catch(() => {});
                       container.style.display = "flex";
                       container.style.alignItems = "center";
                       container.style.justifyContent = "center";
                       mermaidEl.style.width = "100%";
                   } else {
                       document.exitFullscreen();
                   }
                }));

                document.addEventListener('fullscreenchange', () => {
                    if (!document.fullscreenElement) {
                        container.style.display = "block";
                        mermaidEl.style.width = "auto";
                        scale = 1;
                        translateX = 0;
                        translateY = 0;
                        applyTransform();
                    }
                });

                let dragging = false, startX = 0, startY = 0;
                mermaidEl.style.cursor = "grab";
                container.addEventListener("mousedown", (e) => {
                    if (controls.contains(e.target)) return;
                    dragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    mermaidEl.style.cursor = "grabbing";
                    document.body.style.userSelect = "none";
                });
                document.addEventListener("mousemove", (e) => {
                    if (!dragging) return;
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;
                    startX = e.clientX;
                    startY = e.clientY;
                    translateX += dx;
                    translateY += dy;
                    applyTransform();
                });
                document.addEventListener("mouseup", () => {
                    if (!dragging) return;
                    dragging = false;
                    mermaidEl.style.cursor = "grab";
                    document.body.style.userSelect = "auto";
                });
                container.addEventListener("touchstart", (e) => {
                    if (controls.contains(e.target)) return;
                    dragging = true;
                    const t = e.touches[0];
                    startX = t.clientX;
                    startY = t.clientY;
                    document.body.style.userSelect = "none";
                }, { passive: true });
                container.addEventListener("touchmove", (e) => {
                    if (!dragging) return;
                    const t = e.touches[0];
                    const dx = t.clientX - startX;
                    const dy = t.clientY - startY;
                    startX = t.clientX;
                    startY = t.clientY;
                    translateX += dx;
                    translateY += dy;
                    applyTransform();
                }, { passive: true });
                container.addEventListener("touchend", () => {
                    if (!dragging) return;
                    dragging = false;
                    document.body.style.userSelect = "auto";
                });

                // 4. 组装与替换
                container.appendChild(mermaidEl);
                container.appendChild(controls);
                container.onmouseenter = () => controls.style.opacity = "1";
                container.onmouseleave = () => controls.style.opacity = "0";

                if (pre) pre.replaceWith(container);
                else t.parentElement.insertBefore(container, t), container.appendChild(t);
            }
            mermaid.run();
        },
    },
};
