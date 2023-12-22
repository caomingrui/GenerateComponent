let targetDOM = $0;

// 打平的选中dom
let domList = [];

/**
 * 过滤styleSheets依据
 * 根据 属性 | id | class 匹配
 */
let attributeList = [];

// 命中styleSheets
let hitStyleSheets = new Map();

let hitStyleSheets2 = new Map();
let allDOMAttrMap = new Map();

let pendingProcessStyleSheets = document.styleSheets;

let targetStyle = new Set();
let variableCSS = new Map();

function addDOMAttrMap(attr, dom) {
  let tag = attr.name === 'id'? 'ID': 'CLASS';
  let attrs = attr.value.split(' ').map(attr => attr.trim() + "::" + tag);
  for (let i = 0; i < attrs.length; i++) {
    allDOMAttrMap.set(attrs[i], dom);
  }
}

function getTageAttr(attrTag) {
  if (!attrTag) return null;
  return attrTag.split("::")[0]
}


function addTargetDomRecords(dom) {
  domList.push(dom);
  [...dom.attributes].filter(
    (l) => {
      let bool = ['id', 'class'].includes(l.name)
      if (bool) {
        addDOMAttrMap(l, dom);
        return true
      }
      return false
    }
  );
}



function eachTargetDOM(targetDOM) {
  addTargetDomRecords(targetDOM);
  [...targetDOM.children].forEach((el) => {
    eachTargetDOM(el);
  });
}

function filterStyleSheets() {
  let styles = document.querySelectorAll("style");
  if (!styles.length) return;

  for (let i = 0; i < styles.length; i++) {
    const { outerText, sheet } = styles[i];
    
    let domAttr = Array.from(allDOMAttrMap, ([attrTag, _]) => attrTag)
      .filter(l => {
        return Array.from(hitStyleSheets, ([attrTag, _]) => attrTag).includes(l)
      })
      .find((attrTag) => {
        let attr = getTageAttr(attrTag);
        let state = outerText.includes(attr);
        if (state) {
          hitStyleSheets.set(attrTag, sheet);
        }
        return state;
      })
    if (domAttr) continue;
  }
}

function addHitStyleSheets2(attrTag, rule) {
  if (hitStyleSheets2.has(attrTag)) {
    hitStyleSheets2.get(attrTag).push(rule);
  } else {
    hitStyleSheets2.set(attrTag, [rule]);
  }
}


function matchHitStyleSheets() {
  if (!hitStyleSheets.size) return;

  let allHitStyleSheets = Array.from(hitStyleSheets, ([attrTag, sheet]) => ({
    styleSheets: sheet,
    orginDOM: allDOMAttrMap.get(attrTag),
    attrTag
  }))

  for (let i = 0; i < allHitStyleSheets.length; i++) {
    const { styleSheets, attrTag, orginDOM } = allHitStyleSheets[i];
    const rules = styleSheets.cssRules || styleSheets.rules;
    let starMatch = false;
    let defalutBackRuleNumber = Math.ceil(rules.length / 3);
    let backRuleNumber = defalutBackRuleNumber
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
            addHitStyleSheets2(attrTag, rule.cssText);
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
            backRuleNumber = defalutBackRuleNumber;
            addHitStyleSheets2(attrTag, rule.cssText);
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
  let unmatchedDOMAttributes = Array.from(allDOMAttrMap, ([attrTag, _]) => ({
    attrTag,
    orginDOM: allDOMAttrMap.get(attrTag)
  })).filter(l => l.orginDOM);
  
  if (!unmatchedDOMAttributes.length) return;
  /**
   * 未命中样式表
   * 一般是外部引用资源
   */
  let unmatchedStyleSheets = [...pendingProcessStyleSheets].filter(styleSheet => {
    return !Array.from(hitStyleSheets, (res) => res[1]).includes(styleSheet);
  })
  
  for (let i = 0; i < unmatchedStyleSheets.length; i++) {
    
    const styleSheet = unmatchedStyleSheets[i];
    const rules = styleSheet.cssRules || styleSheet.rules;
    if (!rules) continue;
    let starMatch = false;
    let defalutBackRuleNumber = Math.ceil(rules.length / 3);
    let backRuleNumber = defalutBackRuleNumber;

    for (let j = 0; j < rules.length; j++) {
      const rule = rules[j];
      if (starMatch) {
        backRuleNumber -= 1;
        if (backRuleNumber <= 0) break;
      }
      
      unmatchedDOMAttributes.find((records, ind) => {
        const { attrTag, orginDOM } = records;
        const dom = orginDOM;
        if (dom.matches(rule.selectorText)) {
          if (!starMatch) {
            starMatch = true;
          }
          else {
            backRuleNumber = defalutBackRuleNumber;
          }
          addHitStyleSheets2(attrTag, rule.cssText);
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
  console.log(allDOMAttrMap);
  console.log(Array.from(allDOMAttrMap, ([attrTag, _]) => hitStyleSheets2.has(attrTag)).filter(l => l));
}

init();
