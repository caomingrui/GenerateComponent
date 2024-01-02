// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2023-12-31
// @description  try to take over the world!
// @author       You
// @match        http://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(async function () {
    "use strict";
    const targetRecords = {};
  
    let butBaseStyle = {
      background: "#fd7e14",
      padding: "5px",
      margin: "5px",
      display: "inline-block",
      cursor: "pointer",
      color: "#d0bfff",
      fontSize: "18px",
      fontWeight: "bold",
      marginBottom: "20px",
    };
    let inputBaseStyle = {
      padding: "5px 4px",
      minWidth: "96%",
      outline: "none",
      marginBottom: "20px",
      borderColor: "none",
      background: "#c0eb75",
      fontSize: "18px",
      fontWeight: "bold",
      color: "#d0bfff",
    };
  
    let inputCheckDOM, inputComponentName;
  
    let containerChildren = [
      createDOM("h3", null, "CHECK_DOM"),
      (inputCheckDOM = createDOM("input", { style: inputBaseStyle })),
      (inputComponentName = createDOM("input", { style: inputBaseStyle })),
      createDOM(
        "div",
        {
          style: {
            ...butBaseStyle,
          },
          onclick: async function () {
            let checkDOM = inputCheckDOM.targetDOM.value;
            if (!checkDOM) {
              return alert("请输入选中DOM信息");
            }
            let checkClass = "." + checkDOM.replace(/\s/g, ".");
            console.log({ checkClass });
            let element = document.querySelector(checkClass);
            const { cssCode, htmlCode } = await createElement(element);
            console.log(cssCode, htmlCode);
            targetRecords.cssCode = cssCode;
            targetRecords.htmlCode = htmlCode;
          },
        },
        "CREATE"
      ),
      createDOM(
        "div",
        {
          style: {
            ...butBaseStyle,
          },
          onclick: function () {
            openCodepen({
              css: targetRecords.cssCode,
              html: targetRecords.htmlCode,
            });
          },
        },
        "OPEN CODE"
      ),
      createDOM(
        "div",
        {
          style: {
            ...butBaseStyle,
          },
          onclick: function () {
            if (!targetRecords.cssCode || !targetRecords.htmlCode)
              return alert("请先生成选中DOM信息");
            let _componentName = inputComponentName.targetDOM.value;
            fetch("http://localhost:3333/reptile/createComponent", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                htmlCode: targetRecords.htmlCode,
                cssCode: targetRecords.cssCode,
                name: _componentName.value,
                description: "DEMO11",
                options: "",
              }),
            });
          },
        },
        "Send request"
      ),
    ];
  
    let container;
    
    const optionsChilds = [
      createDOM(
        "div",
        {
          style: {
            position: "absolute",
            right: 0,
            top: "50%",
            color: "cyan",
            backgroundColor: "#6366f180",
            display: "flex",
            zIndex: 99999,
            padding: "5px",
            flexDirection: "column",
            cursor: "pointer",
            padding: "10px",
            boxShadow: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(99, 102, 241, 0.5) 0px 10px 15px -3px, rgba(99, 102, 241, 0.5) 0px 4px 6px -4px`,
            fontWeight: "bold",
          },
          onclick: function () {
            let _this = this;
            container.getState('type', (oldV, nVal) => {
              console.log(oldV, nVal, '....');
              if (nVal === 'OPEN') {
                container.setStyle("transform: translateX(0);");
                _this.targetDOM.innerHTML = '<<=';
              } else {
                container.setStyle("transform: translateX(-300px);");
                _this.targetDOM.innerHTML = '=>>';
              }
            })
            container.setState((state) => {
              if (!state.type || state.type === 'CLOSE') return { ...state, type: 'OPEN' };
              return { type: 'CLOSE' };
            });
          },
        },
        "=>>"
      )
    ];
  
    container = createDOM(
      "div",
      {
        style: {
          position: "fixed",
          left: 0,
          top: 0,
          transition: "1s",
          transform: "translateX(-300px)",
          color: "#f1f3f5",
          backgroundColor: "#6366f180",
          zIndex: 99999,
          padding: "5px",
          flexDirection: "column",
          width: "280px",
          padding: "10px",
          boxShadow: `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(99, 102, 241, 0.5) 0px 10px 15px -3px, rgba(99, 102, 241, 0.5) 0px 4px 6px -4px;`,
          height: "100vh",
        },
      },
      ...containerChildren,
    );
  
    document.body.appendChild(container.targetDOM);
    appendElement(document.body, optionsChilds[0]);
  
  
    function createDOM(targetDOM, props, ...childrens) {
      if (typeof targetDOM == "string")
        targetDOM = document.createElement(targetDOM);
      const { ...attrs } = props || {};
      appendElement(targetDOM, ...childrens);
      const stateMAP = new Map();
  
      let targetDOMState = new Proxy({}, {
        set: (target, key, value) => {
          if (stateMAP.has(key) && target[key] != value) {
            [...stateMAP.get(key)].forEach((cb) => {
              cb(target[key], value);
            });
          }
          target[key] = value;
          return true;
        },
        get: (target, key) => {
          return target[key];
        },
      });
  
      const addEvent = (eventKey, cb) => {
        targetDOM.addEventListener(eventKey, cb);
      };
      const setAttribute = (key, val) => {
        targetDOM.setAttribute(key, val);
      };
      const getAttribute = (key) => {
        return targetDOM.getAttribute(key);
      };
      const getStyle = () => getAttribute("style");
      const setStyle = (style) => {
        setAttribute("style", `${getStyle()};${style}`);
      };
      const setState = (state) => {
        if (!state) return;
        let type = Object.prototype.toString.call(state);
        switch(type) {
          case '[object Function]':
            let newState = state(targetDOMState) || {};
            Object.keys(newState).forEach(key => {
              targetDOMState[key] = newState[key];
            })
            return newState;
          default:
            Object.keys(state).forEach(key => {
              targetDOMState[key] = state[key];
            })
            return state;
        }
      }
      const getState = (key, cb) => {
        if (stateMAP.has(key)) {
          let keySet = stateMAP.get(key);
          if (![...keySet].find(fn => fn.toString() === cb.toString())) {
            keySet.add(cb)
          }
        } else {
          let keySet = new Set();
          keySet.add(cb);
          stateMAP.set(key, keySet);
          return targetDOMState[key];
        }
      };
  
      let options = {
        targetDOM,
        addEvent,
        setAttribute,
        getAttribute,
        getStyle,
        setStyle,
        setState,
        getState,
      };
  
      for (let key in attrs) {
        if (key.includes("on")) {
          let eventName = key.split('on')[1]
          addEvent(eventName, attrs[key].bind(options));
        } else {
          if (key === "style") {
            let style = Object.keys(attrs[key]).reduce((s, item) => {
              s += `${toLowerLine(item)}:${attrs[key][item]};`;
              return s;
            }, "");
            setAttribute(key, style);
          } else {
            setAttribute(key, attrs[key]);
          }
        }
      }
  
      return options;
    }
  
    function appendElement(targetDOM, ...childrens) {
      for (let i = 0; i < childrens.length; i++) {
        let children = childrens[i];
        if (typeof children === "string") {
          targetDOM.innerHTML = children;
        } else {
          if (children.hasOwnProperty("targetDOM")) {
            targetDOM.append(children.targetDOM);
          } else {
            targetDOM.append(children);
          }
        }
      }
    }
  
    function toLowerLine(str) {
      var temp = str.replace(/[A-Z]/g, function (match) {
        return "-" + match.toLowerCase();
      });
      if (temp.slice(0, 1) === "-") {
        temp = temp.slice(1);
      }
      return temp;
    }
  
    async function openCodepen({ html, css }) {
      const prettierScript = document.createElement("script");
      prettierScript.src =
        "https://cdn.jsdelivr.net/npm/js-beautify/js/lib/beautify-css.js";
      document.head.appendChild(prettierScript);
  
      const htmlScript = document.createElement("script");
      htmlScript.src =
        "https://cdn.jsdelivr.net/npm/js-beautify/js/lib/beautify-html.js";
      document.head.appendChild(htmlScript);
  
      await Promise.all([
        new Promise((resolve) => {
          prettierScript.onload = resolve;
        }),
        new Promise((resolve) => {
          htmlScript.onload = resolve;
        }),
      ]);
  
      var codepenForm = document.createElement("form");
      codepenForm.setAttribute("action", "https://codepen.io/pen/define");
      codepenForm.setAttribute("method", "POST");
      codepenForm.setAttribute("target", "_blank");
  
      var dataInput = document.createElement("input");
      dataInput.setAttribute("type", "hidden");
      dataInput.setAttribute("name", "data");
      dataInput.value = JSON.stringify({
        html: html_beautify(html, {
          indent_size: 2, // 设置缩进宽度等选项
          // 更多格式化选项
        }),
        css: css_beautify(css, {
          indent_size: 2,
        }),
        editors: "110",
        tags: ["Test"],
      });
      codepenForm.appendChild(dataInput);
      document.body.appendChild(codepenForm);
      codepenForm.submit();
      document.body.removeChild(codepenForm);
      document.head.removeChild(prettierScript);
      document.head.removeChild(htmlScript);
    }
  
    // let targetDOM = $0;
    async function createElement(
      targetDOM,
      allStyleSheets = document.styleSheets
    ) {
      // 打平的选中dom
      let domList = [];
  
      // 命中styleSheets
      let hitStyleSheets = new Map();
  
      // 所有 attrTag( class| id) 字典
      let allDOMAttrMap = new Map();
  
      // attrTag( class| id) 命中rule 字典
      let hitStyleSheets2 = new Map();
  
      // 存储样式 保障样式顺序
      let targetStyle = new Set();
  
      // let pendingProcessStyleSheets = document.styleSheets;
      // export const appCreateElement = (async ({targetDOM, allStyleSheets, domList,hitStyleSheets, allDOMAttrMap, hitStyleSheets2, targetStyle}) => {
      function addDOMAttrMap(attr, dom) {
        let tag = attr.name === "id" ? "ID" : "CLASS";
        let attrs = attr.value.split(" ").map((attr) => attr.trim() + "::" + tag);
        for (let i = 0; i < attrs.length; i++) {
          allDOMAttrMap.set(attrs[i], dom);
        }
      }
  
      function getTageAttr(attrTag) {
        if (!attrTag) return null;
        return attrTag.split("::")[0];
      }
  
      function addTargetDomRecords(dom) {
        domList.push(dom);
        [...dom.attributes].filter((l) => {
          let bool = ["id", "class"].includes(l.name);
          if (bool) {
            addDOMAttrMap(l, dom);
            return true;
          }
          return false;
        });
      }
  
      function VariableCSS() {
        // 存储所需样式变量
        this.variableCSSMap = new Map();
        // 暂存匹配变量
        this.variableList = [];
        /**
         * 临时暂存
         * 针对变量与当前处理StyleSheets同一个文件情况
         * 变量在处理rule 之前
         * rule 中变量还未生成
         */
        this.variableTemporaryMap = new Map();
      }
  
      VariableCSS.prototype.isVariableCSS = function (rule) {
        let state = rule.match(/var\(--[\w-]+\)/g);
        if (!state) return false;
        this.variableList = state;
        return true;
      };
  
      VariableCSS.prototype.analysisVariableCSS = function (variableList) {
        if (!variableList || !variableList.length) {
          variableList = this.variableList;
        }
        variableList.forEach((variableStr) => {
          let variable = variableStr.match(/--[\w-]+/g)[0];
          if (!this.variableCSSMap.has(variable)) {
            this.variableCSSMap.set(
              variable,
              this.variableTemporaryMap.get(variable) || null
            );
          }
        });
        this.variableList = [];
      };
  
      VariableCSS.prototype.matchVariableCSS = function (rule, cb) {
        if (!rule.styleMap) return rule;
        if (!rule.cssText.includes("--")) return rule;
        // if (!rule.selectorText.includes(':root')) return;
        let styleMap = [...rule.styleMap];
        for (let i = 0; i < styleMap.length; i++) {
          const [key, [val]] = styleMap[i];
          if (key.slice(0, 2) !== "--") continue;
          this.variableTemporaryMap.set(key, val[0]);
          if (this.variableCSSMap.get(key) === null) {
            cb && cb();
            this.variableCSSMap.set(key, val[0]);
          }
        }
        return rule;
      };
  
      let variableCSS = new VariableCSS();
  
      function addHitStyleSheets2(attrTag, rule) {
        if (targetStyle.has(rule)) return;
  
        // 标记已使用的变量
        let hasVariableCSSState = variableCSS.isVariableCSS(rule);
        if (hasVariableCSSState) {
          variableCSS.analysisVariableCSS();
        }
  
        if (hitStyleSheets2.has(attrTag)) {
          hitStyleSheets2.get(attrTag).push(rule);
        } else {
          hitStyleSheets2.set(attrTag, [rule]);
        }
        targetStyle.add(rule);
      }
  
      function eachTargetDOM(targetDOM) {
        addTargetDomRecords(targetDOM);
        [...targetDOM.children].forEach((el) => {
          eachTargetDOM(el);
        });
      }
  
      /**
       * 初次根据（class | id）字符匹配style
       * 快速检索 styleSheets
       * @returns
       */
      function filterStyleSheets() {
        let styles = document.querySelectorAll("style");
        if (!styles.length) return;
  
        for (let i = 0; i < styles.length; i++) {
          const { outerText, sheet } = styles[i];
  
          let domAttr = Array.from(allDOMAttrMap, ([attrTag, _]) => attrTag)
            .filter((l) => {
              return Array.from(
                hitStyleSheets,
                ([attrTag, _]) => attrTag
              ).includes(l);
            })
            .find((attrTag) => {
              let attr = getTageAttr(attrTag);
              let state = outerText.includes(attr);
              if (state) {
                hitStyleSheets.set(attrTag, sheet);
              }
              return state;
            });
          if (domAttr) continue;
        }
      }
  
      /**
       * 处理首次命中的styleSheets
       * @returns
       */
      async function matchHitStyleSheets() {
        if (!hitStyleSheets.size) return;
  
        let allHitStyleSheets = Array.from(
          hitStyleSheets,
          ([attrTag, sheet]) => ({
            styleSheets: sheet,
            orginDOM: allDOMAttrMap.get(attrTag),
            attrTag,
          })
        );
  
        await Promise.all(
          allHitStyleSheets.map((hitStyleSheets) =>
            processUnmatchedStyleSheets(
              hitStyleSheets,
              async (
                {
                  rule,
                  styleSheets: allHitStyleSheetsItems,
                  oldhitOldRecordsIndex,
                },
                processRecords
              ) => {
                const { setStarMatch, setRuleDefaultBackRuleNumber } =
                  processRecords;
                const { attrTag, orginDOM } = allHitStyleSheetsItems;
                let hitOldRecordsIndex = oldhitOldRecordsIndex || 0;
                let itemList = domList;
                // 从记录点开始
                if (hitOldRecordsIndex != 0) {
                  itemList = domList
                    .slice(hitOldRecordsIndex)
                    .concat(domList.slice(0, hitOldRecordsIndex));
                }
  
                const hitOldRecords = itemList.find((dom, index) => {
                  if (dom.matches(rule.selectorText)) {
                    // 初始标记的dom 命中， 开始简易优化逻辑
                    if (orginDOM === dom) {
                      setStarMatch(true);
                    } else {
                      setRuleDefaultBackRuleNumber();
                    }
                    addHitStyleSheets2(attrTag, rule.cssText);
                    hitOldRecordsIndex = index;
                    return attrTag;
                  }
                  return false;
                });
                if (hitOldRecords) {
                  hitOldRecords.hitOldRecordsIndex = hitOldRecordsIndex;
                }
                return hitOldRecords;
              }
            )
          )
        );
      }
  
      async function processUnmatchedStyleSheets(styleSheet, cb) {
        try {
          const rules = styleSheet.cssRules || styleSheet.rules;
          if (!rules) return Promise.resolve({});
  
          const processStyleSheetsRecords = function () {
            const records = {
              starMatch: false,
              defalutBackRuleNumber: Math.ceil(rules.length / 3),
              backRuleNumber: Math.ceil(rules.length / 3),
            };
  
            const setRuleBackRuleNumber = (backRuleNumber) => {
              records.backRuleNumber = backRuleNumber;
            };
  
            return Object.freeze({
              getProcessRecords: () => records,
  
              setStarMatch(state) {
                records.starMatch = state;
              },
  
              setRuleMinusBackRuleNumber(n = 1) {
                setRuleBackRuleNumber(records.backRuleNumber - n);
              },
              setRuleDefaultBackRuleNumber() {
                setRuleBackRuleNumber(records.defalutBackRuleNumber);
              },
            });
          };
  
          const processRecords = processStyleSheetsRecords();
          const {
            getProcessRecords,
            setRuleMinusBackRuleNumber,
            setRuleDefaultBackRuleNumber,
          } = processRecords;
  
          const styleSheetsRecords = getProcessRecords();
          // 优化途径
          let oldAttrTag = null;
          let oldhitOldRecordsIndex = 0;
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            if (styleSheetsRecords.starMatch) {
              // records.backRuleNumber -= 1
              setRuleMinusBackRuleNumber();
              if (styleSheetsRecords.backRuleNumber <= 0) break;
            }
  
            variableCSS.matchVariableCSS(rule, setRuleDefaultBackRuleNumber);
  
            if (cb) {
              const hitOldRecords = await cb(
                {
                  styleSheet,
                  rule,
                },
                {
                  ...styleSheetsRecords,
                  ...processRecords,
                  oldhitOldRecordsIndex,
                }
              );
              /**
               * 当 attrTag 改变时， 下次循环从记录点新匹配
               * 举例 list -> [a, b, c]
               * 本次rules a 被命中
               * 下一轮 a 未命中时 可以考虑将其移至末尾，后续从b 开始, 保障快速匹配
               */
              if (hitOldRecords) {
                if (oldAttrTag === null) {
                  oldAttrTag = hitOldRecords.attrTag;
                } else if (oldAttrTag != hitOldRecords.attrTag) {
                  oldAttrTag = hitOldRecords.attrTag;
                  oldhitOldRecordsIndex = hitOldRecords.hitOldRecordsIndex;
                }
              }
            }
          }
        } catch (e) {}
      }
  
      /**
       * 首次未命中的情况 | 存在未命中dom时
       * 遍历为匹配过的所有styleSheets
       * - 外部引用资源
       * - 动态渲染style
       * @returns
       */
      async function checkedDOMList(pendingProcessStyleSheets) {
        // 存在未命中的dom 属性
        let unmatchedDOMAttributes = Array.from(
          allDOMAttrMap,
          ([attrTag, _]) => ({
            attrTag,
            orginDOM: _,
          })
        ).filter(({ attrTag }) => !hitStyleSheets2.has(attrTag));
  
        if (!unmatchedDOMAttributes.length) return;
        /**
         * 未命中样式表
         * 一般是外部引用资源
         */
        let unmatchedStyleSheets = [...pendingProcessStyleSheets].filter(
          (styleSheet) => {
            return !Array.from(hitStyleSheets, (res) => res[1]).includes(
              styleSheet
            );
          }
        );
  
        await Promise.all(
          unmatchedStyleSheets.map((res) =>
            processUnmatchedStyleSheets(
              res,
              async ({ rule, oldhitOldRecordsIndex }, processRecords) => {
                const { starMatch, setStarMatch, setRuleDefaultBackRuleNumber } =
                  processRecords;
  
                let hitOldRecordsIndex = oldhitOldRecordsIndex || 0;
                let itemList = unmatchedDOMAttributes;
                // 从记录点开始
                if (hitOldRecordsIndex != 0) {
                  itemList = domList
                    .slice(hitOldRecordsIndex)
                    .concat(domList.slice(0, hitOldRecordsIndex));
                }
  
                let hitOldRecords = itemList.find((records, index) => {
                  const { attrTag, orginDOM } = records;
                  if (orginDOM.matches(rule.selectorText)) {
                    if (!starMatch) {
                      setStarMatch(true);
                    } else {
                      setRuleDefaultBackRuleNumber();
                    }
                    addHitStyleSheets2(attrTag, rule.cssText);
                    hitOldRecordsIndex = index;
                    return true;
                  }
                  return false;
                });
  
                if (hitOldRecords) {
                  hitOldRecords.hitOldRecordsIndex = hitOldRecordsIndex;
                }
                return hitOldRecords;
              }
            )
          )
        );
      }
  
      let starTime = new Date().getTime();
      eachTargetDOM(targetDOM);
      filterStyleSheets();
      matchHitStyleSheets();
      await checkedDOMList(allStyleSheets);
      console.log(targetStyle);
      console.log(variableCSS.variableCSSMap);
      let endTime = new Date().getTime();
      console.log("执行耗时", endTime - starTime);
      return {
        cssCode: `*{${Array.from(
          variableCSS.variableCSSMap,
          ([key, val]) => `${key}: ${val}`
        ).join(";")}}
          body {padding: 40px}
          ${[...targetStyle].join("")}
          `,
        htmlCode: targetDOM.outerHTML,
      };
    }
  
    // Your code here...
  })();
  