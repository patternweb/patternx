import { fromEvent, skipRepeats, merge } from "most";

const search = document.getElementById("searchbox");
const resultList = document.getElementById("results");
const template = document.getElementById("template").innerHTML;

async function getLibDocs(libName) {
  const url = `libs/${libName}.min.json`;
  const response = await fetch(url);
  const body = await response.json();
  if (response.status === 200) return body;
  else throw Error(response.state);
}

const searchData = data => query =>
  data
    .filter(item => item.name.toLowerCase().startsWith(query.toLowerCase()))
    .map(item => item)
    .sort((a, b) => a.name > b.name);

function init(data) {
  const searchText = fromEvent("input", search)
    .map(e => e.target.value.trim())
    .skipRepeats()
    .multicast();

  const results = searchText
    .filter(text => text.length > 1)
    .debounce(100)
    .map(searchData(data));

  const emptyResults = searchText.filter(text => text.length < 1).constant([]);

  merge(results, emptyResults).observe(resultContent => {
    resultList.innerHTML = resultContent.reduce(
      (html, item) => html + template.replace(/\{name\}/g, item.name),
      ""
    );
  });
}

getLibDocs("three").then(init);
