const functions = require('firebase-functions');
const admin = require('firebase-admin');

const app = require('express')();
// const app = express();

admin.initializeApp();


// TODO go to firebase and enable authentication
// TODO in /functions folder  run npm install --save firebase
const  firebaseConfig = {
    apiKey: "AIzaSyCiiHPBO8CxoW6o5O-tqHu-sH2RuY2UcgA",
    authDomain: "flutter-2630c.firebaseapp.com",
    databaseURL: "https://flutter-2630c.firebaseio.com",
    projectId: "flutter-2630c",
    storageBucket: "flutter-2630c.appspot.com",
    messagingSenderId: "1016933699175",
    appId: "1:1016933699175:web:7999dcb8fe3579370a4ec2",
    measurementId: "G-ZQQ3KZ7MPV"
  };

  const firebase= require('firebase');
  firebase.initializeApp(firebaseConfig);

const db = admin.firestore();


app.get('/screams', (req, res)=>{
    db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data)=>{
        let screams =[];
        data.forEach((doc) => {
            screams.push({
               screamId: doc.id,
               body:doc.data().body,
               userHandle:doc.data().userHandle,
               createdAt:doc.data().createdAt,
            });
        });
        return res.json(screams);
    })
    .catch((err)=>console.error(err));
})


// FBAuth is a middleWare 
const FBAuth = (req, res, next)=>{
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken= req.headers.authorization.split('Bearer ')[1];

    }else{
        console.error('No token found')
        return res.status(403).json({error:'Unauthorized'});
    }


    // TODO u must know how you can manualy authenticate tokens
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken=>{
        // FIXME what is req.user
        req.user =decodedToken;
        console.log(decodedToken);
        return db.collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then(data=>{
        req.user.handle = data.docs[0].data().handle;
        return next();
    })
    .catch(err=>{
        console.error('error while verifying token')
        // because the error is a json
        return res.status(403).json(err)
    })
}



//  ==================
// Post scream 

app.post('/scream', FBAuth,(req, res)=>{
    const newScream ={
        body:req.body.body,
        userHandle:req.body.handle,
        createdAt:new Date().toISOString()
    };


    db
    .collection('screams')
    .add(newScream)
    .then((doc)=>{
        
         res.json({message:`document ${doc.id} created succesfully`});
    })
    .catch((err)=>{
        res.status(400).json({error:'some thing went wrong'});
        console.error(err);
    });


})

const isEmpty= (string)=>{
    if(string.trim()=='') return true;
    else return false;
}
const isEmail = (email)=>{
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    else return false;
}


// ===================
//  SignUp route

app.post('/signup', (req, res)=>{

    
    const newUser ={
        email:req.body.email,
        password:req.body.password,
        confirmPassword:req.body.confirmPassword,
        handle:req.body.handle,
       
    };

    let errors ={};

    if (isEmpty(newUser.email)){
        errors.email= 'Email can not be Empty'
    }else if(!isEmail(newUser.email)){
        errors.email =' Must be a valid Email adress'
    }

    if (isEmpty(newUser.password)) errors.password= 'password can not be Empty'    
    if (isEmpty(newUser.handle)) errors.handle= 'handle can not be Empty'    
    if(newUser.password!== newUser.confirmPassword) errors.password = 'password must match'

    if(Object.keys(errors).length> 0 ) return res.status(400).json(errors);

    

    let token, userIDs;
    // checks if the user handles exists then create user in the authentication part
    db.doc(`/users/${newUser.handle}`).get()
    .then(doc=>{
        if(doc.exists){
            return res.status(400).json({handle:'HANDLE_EXISTS'});
        }else{
            return firebase.auth().createUserWithEmailAndPassword(newuser.email, newUser.password);
        }
    })
  
  .then((data=>{
    userIDs= data.user.uid;
    return data.user.getIdToken();
       
    }))
    // create user in the user database 
    .then((idToken)=>{
        token=idToken;
        const userCredentials ={

            email:newUser.email,
            createdAt:new Date().toISOString(),
            handle:newUser.handle,
            userId:userIDs
           
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);

    }).then(()=>{
        return res.status(201).json({token});

    })
    .catch((err)=>{
        console.error(err);
        if (err.code==='auth/email-already-in-use'){
            return res.status(400).json({handle:'EMAIL_EXISTS'});
        }
        return res.status(500).json({error:err.code});
        
    });
})

// ================
// login route

app.post('/login', (req, res)=>{
    const user = {
        email: req.body.email,
        password:req.body.password
    }

    //  ==========-----validating fields ------------=========

    const errors={

    }

    if(isEmpty(user.email)){
        errors.email= 'email can not be empty'
    }else if(!isEmail(user.email)){
        errors.email = 'email must be valid'
    }

    if(isEmpty(user.password)) errors.password= 'password can not be empty'
    if(isEmail(user.email)) errors.email= ''

    if(Object.keys(errors).length> 0 ) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data=>{
        return data.user.getIdToken();
    })
    .then(token =>{
        return res.json({token})
    })
    .catch(err=>{
        console.error(err);
        if(err.code==='auth/wrong-password'){
            return res.status(403).json({general: 'Wrong credentials, please try again'});
        }else
        res.status(500).json({error:err.code});
    })





})

exports.api = functions.region('europe-west1').https.onRequest(app);