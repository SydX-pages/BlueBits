document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('pre[class*="language-"]').forEach(function (pre) {
    // 创建按钮
    const button = document.createElement("button");
    button.className = "prismjs-copy-button";
    button.textContent = "Copy";

    // 点击事件
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

    // 添加按钮到 pre
    pre.appendChild(button);
  });
});
