function removeTags(string) {
    if ((string === null) || (string === ''))
        return false;
    else {
        string = string.toString();
        return string.replace(/(<([^>]+)>)/ig, '');
    }
}

module.exports = removeTags;