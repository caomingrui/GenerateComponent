let targetDOM = $0;

// 打平的选中dom
const domList = [];

/**
 * 过滤styleSheets依据
 * 根据 属性 | id | class 匹配
 */
let attributeList = [];

// 命中styleSheets
const hitStyleSheets = new Map();

let pendingProcessStyleSheets = document.styleSheets;

let targetStyle = new Set();
let variableCSS = new Map();

let excludeAttributes = [
  "style",
  "href",
  "title",
  "width",
  "src",
  "alt",
  "border",
  "height",
  "xlink:href",
  "d",
  "fill-rule",
  "clip-rule"
];

function addTargetDomRecords(dom) {
  domList.push(dom);
  let attributes = [...dom.attributes].filter(
    (l) => !excludeAttributes.includes(l.name)
  );
  if (!attributes.length) {
    attributeList.push(null);
  }

  let attrs = attributes;
  attrs.orginDOM_ = dom;
  attributeList.push(attrs);
  attributeList = attributeList.filter((l) => l);
}

function eachTargetDOM(targetDOM) {
  addTargetDomRecords(targetDOM);
  [...targetDOM.children].forEach((el) => {
    eachTargetDOM(el);
  });
}

function filterStyleSheets() {
  let styles = document.querySelectorAll("style");
  let domAttrs = attributeList.filter((l) => l);
  if (!styles.length) return;

  for (let i = 0; i < styles.length; i++) {
    const { outerText, sheet } = styles[i];
    let domAttr = domAttrs
      .filter((l) => !l.mark)
      .find((attr, index) => {
        let state = attr.find((s) => outerText.includes(s.value));
        if (state) {
          attr.mark = true;
          attr.markAttr = state.value;
          attr.orginDOMIndex = index;
          hitStyleSheets.set(attr, sheet);
        }
        return state;
      });
    if (domAttr) continue;
  }
}


function matchHitStyleSheets() {
  let allHitStyleSheets = attributeList
  .filter(attr => attr.mark)
  .map(attr => ({
    styleSheets: hitStyleSheets.get(attr),
    ...attr,
  }));

  for (let i = 0; i < allHitStyleSheets.length; i++) {
    const { styleSheets, markAttr, orginDOMIndex } = allHitStyleSheets[i];
    const orginDOM = domList[orginDOMIndex];
    const rules = styleSheets.cssRules || styleSheets.rules;
    let starMatch = false;
    let backRuleNumber = 50;
    let styleRules = [...rules];

    for (let j = 0; j < styleRules.length; j ++) {
      const rule = styleRules[j];
      /**
       * 命中初始dom属性
       * 以改rule为例 后50个rule没有匹配 其他dom 跳出
       * 这里参考组件样式属性一般放在一起
       */
      if (orginDOM.matches(rule.selectorText)) {
        starMatch = true
      }
      else{
        // 开始 - 目标正常匹配
        domList.find((dom, ind) => {
          if (dom.matches(rule.selectorText)) {
            Object.assign(attributeList[ind], {
              mark: true,
              orginDOMIndex: ind,
            })
            targetStyle.add(rule.cssText)
            return true
          }
          return false
        })
      }
      if (starMatch) {
        backRuleNumber -= 1;
        if (backRuleNumber <= 0) break;

        domList.find((dom, ind) => {
          if (dom.matches(rule.selectorText)) {
            backRuleNumber = 50;
            Object.assign(attributeList[ind], {
              mark: true,
              orginDOMIndex: ind,
            })
            targetStyle.add(rule.cssText)
            return true
          }
          return false;
        })
      }
    }
  }
}


function checkedDOMList() {
  // 存在未命中的dom 属性
  let unmatchedDOMAttributes = attributeList.filter((l) => !l.mark);
  
  if (!unmatchedDOMAttributes.length) return;
  /**
   * 未命中样式表
   * 一般是外部引用资源
   */
  let unmatchedStyleSheets = [...pendingProcessStyleSheets].filter(styleSheet => {
    return Array.from(hitStyleSheets, (res) => res[1]).includes(styleSheet);
  })
  console.log(unmatchedDOMAttributes, unmatchedStyleSheets);
  for (let i = 0; i < unmatchedStyleSheets.length; i++) {
    
    const styleSheet = unmatchedStyleSheets[i];
    const rules = styleSheet.cssRules || styleSheet.rules;
    if (!rules) continue;
    let starMatch = false;
    let backRuleNumber = 50;

    for (let j = 0; j < rules.length; j++) {
      const rule = rules[j];
      if (starMatch) {
        backRuleNumber -= 1;
        if (backRuleNumber <= 0) break;
      }
      
      unmatchedDOMAttributes.find((records, ind) => {
        const { orginDOM_ } = records;
        const dom = orginDOM_;
        if (dom.matches(rule.selectorText)) {
          if (!starMatch) {
            starMatch = true;
          }
          else {
            backRuleNumber = 50;
          }
          Object.assign(attributeList[ind], {
            mark: true,
            orginDOMIndex: ind,
          })
          targetStyle.add(rule.cssText)
          return true
        }
        return false
      })
    }
  }
}


function init() {
  eachTargetDOM(targetDOM);
  filterStyleSheets();
  matchHitStyleSheets();
  checkedDOMList();
  console.log(targetStyle);
  console.log(attributeList.filter(l => !l.mark));
}

init();
