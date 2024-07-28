// react17提出的concurrent mode 实现思路
// 1. 将一个大的渲染过程，拆分成一个个小的渲染过程，解决了卡顿问题

// 下一个要执行的单元
let nextUnitWork = null; // 一个执行单元其实就是一个Fiber片段

// * workInProgress 当前正在执行的 fiber 节点
let wipRoot = null; 

function commitWork(fiber) {
  if(!fiber) return;
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitRoot() {
  commitWork(wipRoot.child);
  wipRoot = null;
}
//自动调度
function workLoop(deadline) {
  // console.log(deadline.timeRemaining()); // 浏览器的空闲时间
  while(nextUnitWork) {
    nextUnitWork = performUnitOfWork(nextUnitWork);
  }
  // * Fiber Tree已经准备好，需要一次性的挂载 DOM
  // * 一次性把 fiber tree 挂载到页面上的过程，在 React 中叫做 commit 阶段
  if(!nextUnitWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop); 
}
// 浏览器空闲时，执行workLoop方法
requestIdleCallback(workLoop); 

// 该函数用来处理下一个执行单元，同时返回下下一个执行的单元
// * 用来生成 Fiber Tree的函数，生成 Fiber Tree的过程，在 React 中叫做 Render 阶段
function performUnitOfWork(fiber) {
  // 1. 把fiber的内容渲染到页面上
  if(!fiber.dom) {
    fiber.dom = ReactDOM.createDom(fiber);
  }
  // * 当浏览器有一个大的需要执行的JS任务时，如果此时DOM渲染还没有完成，则后面的DOM渲染会被阻塞
  // if(fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom);
  // }

  // 2. 计算下一层fiber tree
  const elements = fiber.props.children;
  let index = 0;
  let preSibling = null;
  while(index < elements.length) {
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      dom: null,
      parent: fiber
    }
    if(index === 0 ) {
      fiber.child = newFiber;
    } else {
      preSibling.sibling = newFiber;
    }

    preSibling = newFiber;
    index++;
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
      }
    }
    nextUnitWork = wipRoot;
  }
  // 上面render方法存在的问题
  // 1. 当需要渲染的内容比较多时，容易出现卡顿问题
}