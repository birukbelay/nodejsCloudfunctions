// FBAuth is a middleWare 
const { db} = require('../admin');

const users=[
    {
        userId: 'N43KJ5H43KJHREW4J5H3JWMERHB',
        email: 'user@email.com',
        userName: 'user',
        createdAt: '2019-03-15T10:59:52.798Z',
        imageUrl: 'image/dsfsdkfghskdfgs/dgfdhfgdh',
        bio: 'Hello, my name is user, nice to meet you',
        website: 'https://user.com',
        location: 'Lonodn, UK'
      },

]

module.exports = (req, res, next)=>{

        req.user ={};  

        return db.collection('users')
        .where('userId', '==', users[0].userId)
        .limit(1)
        .get()
    .then(data=>{
        // FIXME we are setting  the userName & imageUrl of the user 
        // and the [0].data()  is a function
        // req.user.userNmae = data.docs[0].data().userName;
        req.user.userName = users[0].userName;
        req.user.imageUrl = users[0].imageUrl;
        return next()
    })
        // FIXME we are setting  the userName & imageUrl of the user 
        // and the [0].data()  is a function
        
   
    .catch(err=>{
        console.error(`error IN fbAuth ${err}`)
        // because the error is a json
        return res.status(403).json(err)
    })
}


