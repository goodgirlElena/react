// react17提出的concurrent mode 实现思路
// 1. 将一个大的渲染过程，拆分成一个个小的渲染过程，解决了卡顿问题

// 下一个要执行的单元
let nextUnitWork = null; 

//自动调度
function workLoop(deadline) {
  // console.log(deadline.timeRemaining()); // 浏览器的空闲时间
  while(nextUnitWork) {
    nextUnitWork = performUnitOfWork(nextUnitWork);
  }
  requestIdleCallback(workLoop); 
}

// 该函数用来处理下一个执行单元，同时返回下下一个执行的单元
function performUnitOfWork(nextUnitOfWork) {
  return null;
}

// 浏览器空闲时，执行workLoop方法
requestIdleCallback(workLoop); 

const ReactDOM = {
  render: function(element, container) {
    // 1. 创建合理的元素节点
    const dom = element.type === 'TEXT_NODE' ? document.createTextNode('') :
    document.createElement(element.type);
    // 2. 给元素添加属性
    Object.keys(element.props).filter(key => key !== 'children').forEach(name => {
      dom[name] = element.props[name];
    })

    // 3. 循环遍历子节点，递归调用render方法
    if(element.props.children.length > 0) {
      element.props.children.forEach(child => ReactDOM.render(child, dom));
    }
    container.appendChild(dom);
  }
  // 上面render方法存在的问题
  // 1. 当需要渲染的内容比较多时，容易出现卡顿问题
}