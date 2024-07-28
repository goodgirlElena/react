const React = {
  createElement: function(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children: children.map(child => {
          if(typeof child === 'object') {
            return child;
          } else {
            return {
              type: 'TEXT_NODE',
              props: {
                nodeValue: child,
                children: []
              }
            }
          }
        })
      }
    }
  }
}