
// http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
function getURLParameter(name) {
  return decodeURI(
    (new RegExp('[&?]'+name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
  );
}
