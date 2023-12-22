let targetDOM = $0;

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

let pendingProcessStyleSheets = document.styleSheets;


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

VariableCSS.prototype.isVariableCSS = function(rule) {
  let state = rule.match(/var\(--[\w-]+\)/g);
  if (!state) return false;
  this.variableList = state;
  return true
}

VariableCSS.prototype.analysisVariableCSS = function(variableList) {
  if (!variableList || !variableList.length) {
    variableList = this.variableList;
  };
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
}

VariableCSS.prototype.matchVariableCSS = function(rule, cb) {
  if (!rule.styleMap) return rule;
  if (!rule.cssText.includes('--')) return rule; 
  // if (!rule.selectorText.includes(':root')) return;
  let styleMap = [...rule.styleMap];
  for (let i = 0; i < styleMap.length; i++) {
    const [key, [val]] = styleMap[i];
    if (key.slice(0, 2) !== '--') continue;
    this.variableTemporaryMap.set(key, val[0]);
    if (this.variableCSSMap.get(key) === null) {
      cb && cb()
      this.variableCSSMap.set(key, val[0]);
    }
  }
  return rule;
}

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


/**
 * 处理首次命中的styleSheets
 * @returns 
 */
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

      variableCSS.matchVariableCSS(rule, () => {
        backRuleNumber = defalutBackRuleNumber;
      });
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
        domList.find(dom => {
          if (dom.matches(rule.selectorText)) {
            addHitStyleSheets2(attrTag, rule.cssText);
            return true
          }
          return false
        })
      }

      if (starMatch) {
        backRuleNumber -= 1;
        if (backRuleNumber <= 0) break;

        domList.find(dom => {
          if (dom.matches(rule.selectorText)) {
            backRuleNumber = defalutBackRuleNumber;
            addHitStyleSheets2(attrTag, rule.cssText);
            return true
          }
          return false;
        })
      }
    }
  }
}


/**
 * 首次未命中的情况 | 存在未命中dom时
 * 遍历为匹配过的所有styleSheets
 * - 外部引用资源
 * - 动态渲染style
 * @returns 
 */
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
      
      variableCSS.matchVariableCSS(rule, () => {
        backRuleNumber = defalutBackRuleNumber;
      });

      /**
       * 可优化
       * 举例 unmatchedDOMAttributes -> [a, b, c]
       * 本次rules a 被命中
       * 下一轮 a 未命中时 可以考虑将其移至末尾，后续从b 开始, 保障快速匹配
       */
      unmatchedDOMAttributes.find(records => {
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
          return true
        }
        return false
      })
    }
  }
}


function init(targetDOM) {
  eachTargetDOM(targetDOM);
  filterStyleSheets();
  matchHitStyleSheets();
  checkedDOMList();
  console.log(targetStyle);
  console.log(variableCSS.variableCSSMap);
}

init(targetDOM);
