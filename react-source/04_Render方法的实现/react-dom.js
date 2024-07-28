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
}