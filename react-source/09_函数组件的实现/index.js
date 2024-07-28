function App(props) {
  return <h1>hello,{props.name}</h1>
}
ReactDOM.render(<App name={'React'} />, document.getElementById('root'));
