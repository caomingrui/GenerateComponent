

function CreateTemplate() {
    this.componentMap = new Map();
}


CreateTemplate.prototype.createStyle = function (props) {
    if (!props) throw new Error('createStyle props 不能为空');
    const { variableCSS, targetStyle } = props;
    let styles = [];
    if (variableCSS && variableCSS.size > 0) {
        const style = document.createElement("style");
        style.textContent = `
                  :root {
                    ${Array.from(variableCSS).join(";")}
                  }
                `;
        styles.push(style)
    }

    if (targetStyle) {
        const style = document.createElement("style");
        style.textContent = [...targetStyle].join(";");
        styles.push(style)
    }
    return styles;
}

CreateTemplate.prototype.createWebComponent = function (content, props) {
    let _this = this;
    return class CustomTemplate extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: "open" });
            const wrapper = document.createElement("div");
            wrapper.classList.add("component-test");
    
            // 设置默认样式
            let styles = _this.createStyle(props);
            styles.forEach(style => {
                shadow.appendChild(style);
            })
            
            const clonedContent = content.cloneNode(true);
            wrapper.appendChild(clonedContent);
            shadow.appendChild(wrapper);
        }
    }
};


CreateTemplate.prototype.addComponents = function (componentName, customTemplate) {
    if (this.componentMap.has(componentName)) return;
    this.componentMap.set(componentName, customTemplate);
    customElements.define(componentName, customTemplate);
}