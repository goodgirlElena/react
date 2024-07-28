function App() {
  const [counter, setCounter] = ReactDOM.useState(0);
  return <h1 onClick={() => setCounter(c => c+1)}>{counter}</h1>
}
ReactDOM.render(<App name={'React'} />, document.getElementById('root'));
