let targetDOM = $0;

let targetStyle = new Set();
let variableCSS = new Map();

function matchTargetStyle(dom) {
  let styleSheets = document.styleSheets;

  for (let i = 0; i < styleSheets.length; i++) {
    const styleSheet = styleSheets[i];
    const rules = styleSheet.cssRules || styleSheet.rules;
    if (!rules) continue;
    [...rules]
      .map((rule) => matchVariableCSS(rule))
      .filter((rule) => dom.matches(rule.selectorText))
      .reduce((styles, rule) => {
        styles.add(rule.cssText);
        analysisVariableCSS(rule);
        return styles;
      }, targetStyle);
  }
}

function analysisVariableCSS(rule, cssMap = variableCSS) {
  let variableList = rule.cssText.match(/var\(--[\w-]+\)/g);
  if (!variableList) return;
  variableList.forEach((variableStr) => {
    let variable = variableStr.match(/--[\w-]+/g)[0];
    if (!cssMap.has(variable)) {
      cssMap.set(variable, null);
    }
  });
}

function matchVariableCSS(rule, cssMap = variableCSS) {
  if (!rule.styleMap) return rule;
  [...rule.styleMap].forEach(([key, [val]]) => {
    if (cssMap.get(key) === null) {
      cssMap.set(key, val[0]);
    }
  });
  return rule;
}

function eachTargetDOM(targetDOM) {
  matchTargetStyle(targetDOM);
  [...targetDOM.children].forEach((el) => {
    eachTargetDOM(el);
  });
}

function createWebComponent(componentName) {
  class CustomDiv extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: "open" });
      const wrapper = document.createElement("div");
      wrapper.classList.add("component-test");
      wrapper;

      // 设置默认样式
      const style = document.createElement("style");
      style.textContent = `
            ${[...targetStyle].join("")}
          `;
      shadow.appendChild(style);
      const clonedContent = targetDOM.cloneNode(true);
      wrapper.appendChild(clonedContent);
      shadow.appendChild(wrapper);
    }
  }

  customElements.define(componentName, CustomDiv);
}

function init() {
  eachTargetDOM(targetDOM);
//   createWebComponent("custom-component");
  console.log([...targetStyle].join(';'));

  console.log([...variableCSS].reduce((varStr, item) => {
      const [key, val] = item;
      varStr += `${key}: ${val};`;
      return varStr;
  }, ''));
}

init();
