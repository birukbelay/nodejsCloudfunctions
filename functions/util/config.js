

// TODO go to firebase and enable authentication
// TODO in /functions folder  run npm install --save firebase
module.exports =  {
    apiKey: process.env.apikey,
    authDomain:  process.env.authDomain,
    databaseURL:  process.env.databaseURL,
    projectId:  process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId:  process.env.messagingSenderId,
    appId:  process.env.appId,
    measurementId:  process.env.measurementId,
  };
