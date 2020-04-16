// FBAuth is a middleWare 
const {admin, db} = require('./admin');

module.exports = (req, res, next)=>{
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken= req.headers.authorization.split('Bearer ')[1];

    }else{
        console.error('No token found')
        return res.status(403).json({error:'Unauthorized'});
    }


    // TODO u must know how you can manualy authenticate tokens
    // FIXME what is the response data of the `verifyIdToken` function
    admin.auth().verifyIdToken(idToken)
    .then(decodedToken=>{
        // FIXME what is req.user  -- may be it is setting another son to the req param
        req.user =decodedToken;
        // console.log(decodedToken);
        return db.collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then(data=>{
        // FIXME we are setting  the userName & imageUrl of the user 
        // and the [0].data()  is a function
        req.user.userNmae = data.docs[0].data().userName;
        req.user.imageUrl =data.docs[0].data().imageUrl;
        return next();
    })
    .catch(err=>{
        console.error('error while verifying token')
        // because the error is a json
        return res.status(403).json(err)
    })
}
