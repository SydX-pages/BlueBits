document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('pre[class*="language-"]').forEach(function (pre) {
    // 创建外层容器
    const wrapper = document.createElement("div");
    wrapper.className = "code-block";

    // 创建工具栏
    const toolbar = document.createElement("div");
    toolbar.className = "code-toolbar";

    // 创建按钮
    const button = document.createElement("button");
    button.className = "prismjs-copy-button";
    button.textContent = "Copy";

    button.addEventListener("click", function () {
      const code = pre.querySelector("code").innerText;
      navigator.clipboard.writeText(code).then(
        function () {
          button.textContent = "Copied!";
          setTimeout(() => (button.textContent = "Copy"), 1500);
        },
        function () {
          button.textContent = "Copy Failed!";
          setTimeout(() => (button.textContent = "Copy"), 1500);
        },
      );
    });

    // 拼装结构
    toolbar.appendChild(button);
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(pre);
  });
});
