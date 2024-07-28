// react17提出的concurrent mode 实现思路
// 1. 将一个大的渲染过程，拆分成一个个小的渲染过程，解决了卡顿问题

// 下一个要执行的单元
let nextUnitWork = null; // 一个执行单元其实就是一个Fiber片段

//自动调度
function workLoop(deadline) {
  // console.log(deadline.timeRemaining()); // 浏览器的空闲时间
  while(nextUnitWork) {
    nextUnitWork = performUnitOfWork(nextUnitWork);
  }
  requestIdleCallback(workLoop); 
}

// 该函数用来处理下一个执行单元，同时返回下下一个执行的单元
function performUnitOfWork(fiber) {
  // 1. 把fiber的内容渲染到页面上
  if(!fiber.dom) {
    fiber.dom = ReactDOM.createDom(fiber);
  }
  if(fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

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

// 浏览器空闲时，执行workLoop方法
requestIdleCallback(workLoop); 

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
    nextUnitWork = {
      dom: container,
      props: {
        children: [element]
      }
    }
  }
  // 上面render方法存在的问题
  // 1. 当需要渲染的内容比较多时，容易出现卡顿问题
}