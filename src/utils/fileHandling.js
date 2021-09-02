  /**
   * Save file to local storage.
   * @param {string} filename
   */
   const saveFile = (filename, data) => {
    var file = new Blob([JSON.stringify(data)], {type: 'text/json'});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

const openFile = (callback, allowedTypes = ['.ima'], type = 'text') => {
  const file = document.createElement('input')
  file.type = 'file'
  file.accept = allowedTypes.join(', ')
  file.click()
  file.addEventListener('change', item => {
    const fileName = getFileName(item.target.value)
    const reader = new FileReader()
    reader.onload = (result) => {
      callback(result.target.result, fileName)
    }
    if (type === 'text') {
      reader.readAsText(file.files[0])
    } else {
      reader.readAsDataURL(file.files[0])
    }
  })
}

/**
 * Get file name of the image
 * @param {string} filePath
 * @returns {string}
*/
const getFileName = (file) => {
  const startIndex = (file.indexOf('\\') >= 0
    ? file.lastIndexOf('\\')
    : file.lastIndexOf('/'))

  return file.substring(startIndex + 1)
}

export {
  saveFile,
  openFile,
  getFileName
}
