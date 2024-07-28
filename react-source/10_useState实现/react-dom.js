// react17提出的concurrent mode 实现思路
// 1. 将一个大的渲染过程，拆分成一个个小的渲染过程，解决了卡顿问题

// 下一个要执行的单元
let nextUnitWork = null; // 一个执行单元其实就是一个Fiber片段

// workInProgress 当前正在执行的 fiber 节点
let wipRoot = null; 

// 存储上一次渲染对应的 Fiber Tree 入口
let currentRoot = null;

// 需要移除的节点
let deletions = [];

let wipFiber = null; // * 全局存储当前正在执行的Fiber节点
let hookIndex = null; // * 当前正在执行的hook索引

const isEvent = (key) => key.startsWith('on');
const isProperty = (key) => key !== 'children' && !isEvent(key);
const isNew = (newProps, prevProps) => (key) => newProps[key] !== prevProps[key];
const isGone = ( newProps) => (key) => !(key in newProps);
// 更新DOM节点函数
function updateDom(dom, newProps, prevProps) {
  // 清除老的DOM属性
  console.log("oldKeys", Object.keys(prevProps))
  console.log("isProperty", Object.keys(prevProps).filter(isProperty))
  console.log("isGone", Object.keys(prevProps).filter(isProperty).filter(isGone(newProps)))
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(newProps))
    .forEach(name => dom[name] = '');

  // 清除老或被改变的DOM事件
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in newProps) || isNew(newProps, prevProps)(key))
    // .filter(isNew(newProps, prevProps))
    .forEach(name => {
      const eventName = name.toLowerCase().substring(2);
      dom.removeEventListener(eventName, prevProps[name]);
    })

  // 增加新的或者更新老的DOM事件
  Object.keys(newProps)
    .filter(isEvent)
    .filter(isNew(newProps, prevProps))
    .forEach(name => {
      const eventName = name.toLowerCase().substring(2);
      dom.addEventListener(eventName, newProps[name]);
    })
    
  // 增加新的或者更新老的DOM属性
  Object.keys(newProps)
    .filter(isProperty)
    .filter(isNew(newProps, prevProps))
    .forEach(name => dom[name] = newProps[name]);
}


function commitDeletion(fiber, domParent) {
  if(fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function commitWork(fiber) {
  if(!fiber) return;

  // START
  let domParentFiber = fiber.parent;
  while(!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;
  // END
  if(fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
    updateDom(fiber.dom, fiber.props, {})
  } else if(fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent);
  } else if(fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.props, fiber.alternate.props)
  }
  
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitRoot() {
  deletions.forEach(commitWork); // 删除需要删除的节点
  commitWork(wipRoot.child);
  currentRoot = wipRoot; // 存储上一次需要渲染的数据
  wipRoot = null;
}
//自动调度
function workLoop(deadline) {
  // console.log(deadline.timeRemaining()); // 浏览器的空闲时间
  while(nextUnitWork) {
    nextUnitWork = performUnitOfWork(nextUnitWork);
  }
  // Fiber Tree已经准备好，需要一次性的挂载 DOM
  // 一次性把 fiber tree 挂载到页面上的过程，在 React 中叫做 commit 阶段
  if(!nextUnitWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop); 
}
// 浏览器空闲时，执行workLoop方法
requestIdleCallback(workLoop); 

// 调协函数
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let preSibling = null;
  while(index < elements.length) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element.type === oldFiber.type;
    if(sameType){
      // update origin dom
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE'
      }
    }
    if(oldFiber && !sameType) {
      // delete old dom
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }
    if(element && !sameType) {
      // add new dom
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT'
      }
    }
    if(index === 0 ) {
      wipFiber.child = newFiber;
    } else {
      preSibling.sibling = newFiber;
    }

    preSibling = newFiber;
    index++;
  }
}

// START
function updateHostComp(fiber) {
   // 1. 把fiber的内容渲染到页面上
  if(!fiber.dom) {
    fiber.dom = ReactDOM.createDom(fiber);
  }

  // 2. 计算下一层fiber tree
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}  

function updateFuncComp(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

// END

// 该函数用来处理下一个执行单元，同时返回下下一个执行的单元
// 用来生成 Fiber Tree的函数，生成 Fiber Tree的过程，在 React 中叫做 Render 阶段
function performUnitOfWork(fiber) {
  console.log(fiber)
  // 新增函数组件的逻辑
  const isFunctionComp = fiber.type instanceof Function;
  if(isFunctionComp) {
    updateFuncComp(fiber);
  } else {
    updateHostComp(fiber);
  }
  // 3. 选择下一个要执行的fiber单元
  if(fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while(nextFiber) {
    if(nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}


const ReactDOM = {
  createDom: function(fiber) {
    // 1. 创建合理的元素节点
    const dom = fiber.type === 'TEXT_NODE' ? document.createTextNode('') :
    document.createElement(fiber.type);
    // 2. 给元素添加属性
    Object.keys(fiber.props).filter(key => key !== 'children').forEach(name => {
      dom[name] = fiber.props[name];
    })
    return dom
  },
  render: function(element, container) {
    // 由于babel的存在，此处的element已经是一个由JSX转换成的JS对象
    wipRoot = {
      dom: container,
      props: {
        children: [element]
      },
      alternate: currentRoot // 存储上一次需要渲染的数据
    }
    deletions = []; // 需要移除的节点
    nextUnitWork = wipRoot;
  },
  // 上面render方法存在的问题
  // 1. 当需要渲染的内容比较多时，容易出现卡顿问题
  useState: function(initial) {
    // debugger
    const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
    const hook = {
      state: oldHook ? oldHook.state : initial,
      queue: []
    }
    const actions = oldHook ? oldHook.queue : [];
    actions.forEach(action => {
      hook.state = action(hook.state);
    })
    const setState = action => {
      hook.queue.push(action);
      wipRoot = {
        dom: currentRoot.dom,
        props: currentRoot.props,
        alternate: currentRoot
      }
      deletions = [];
      nextUnitWork = wipRoot;
    }
    wipFiber.hooks.push(hook);
    hookIndex++;
    return [hook.state, setState]
  }
}