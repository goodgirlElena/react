const divObject = (
  <div>
    <h1>
      <p>Paragraph</p>
      <a href='https://www.immoc.com'>Link</a>
    </h1>
    <h2>Subtitle</h2>
  </div>
)
console.log(divObject)
ReactDOM.render(divObject, document.getElementById('root'));
const newObj = (
  <div>
    <h1>
      Paragraph 2
    </h1>
    <h2>Subtitle</h2>
  </div>
)
ReactDOM.render(newObj, document.getElementById('root'));