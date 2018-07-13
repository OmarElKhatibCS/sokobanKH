function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
};

function getNbOfDirFiles(path) {
  const fs = require('fs');
  const dir = path;

  fs.readdir(dir, (err, files) => {
    return files.length;
  });
};

function checkDigits(number) {
  var length = 0;
  while(Math.round(number) > 0) {
    number /= 10;
    length++;
  }
  return length;
};

function digitsToTens(length) {
  var theTen = 1;
  for(i=1;i<=length;i++) {
    theTen *= 10;
  }
  return theTen;
}
