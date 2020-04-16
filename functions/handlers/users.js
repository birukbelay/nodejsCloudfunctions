const { db } = require('../util/admin');


// |========| 1 |===================================|
// |========-----  addUserDetail-----------=========|
// |================================================|

exports.addUserDetail= (req, res)=>{
     let userDetails = reduceUserDetails(req.body);
     db.doc(`/users/${req.user.userName}`)
     .update(userDetails)
     .then(()=>{
         return res.json({message:'Details added succesfully'});
     })
     .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code });
    })
}

// |========| 2 |============================================|
// |========-----  get anyUserDetails ---------==============|
// |=========================================================|

exports.getUserDetails=(req, res)=>{
    let userName=req.params.userName;
    let userData={};

    db.doc(`users/${userName}`)
    .get()
    .then((doc)=>{
        if(!doc.exists)return res.status(404).json({error:'USER_NOT_FOUND'}); 
        userData.user=doc.data();
        return db.collection('screams').where('userName', '==', userName)
        .orderBy('createdAt', 'desc')
        .get();
    })
    .then(data=>{
        userData.screams=[];
        data.forEach(doc=>{
            userData.screams.push({
                body:doc.data().body,
                createdAt:doc.data().createdAt,
                userName:doc.data().userName,
                userImage:doc.data().userImage,
                likeCount:doc.data().likeCount,
                commentCount:doc.data().commentCount,
                screamId:doc.id,
            })
        });
        return res.status(200).json({userData})
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code });
    })
}

// |========| 3 |===========================================|
// |========-----  get OwnUserDetails ---------=============|
// |========================================================|
exports.getAuthenticatedUser=(req, res)=>{
    let userName =req.user.userName;
    let userData ={}
    db.doc(`/users/${req.user.userName}`)
    .get()
    .then((doc)=>{
        if(doc.exists){
            userData.credentials= doc.data();

// ====-----------    Get Likes of the user ---------------=======

            // FIXME  put the likes in the user table  
            return db.collection('likes')            
            .where('userName', '==', userName)
            .get()
        }
    }).then((data)=>{
        userData.likes=[];
        // this uses push and for each because it has many likes where as user have only one credentials
        data.forEach((doc)=>{
            userData.likes.push(doc.data());
        });
// ====-----------    Get Notifications ---------------=======
        return db.collection('notifications')
        .where('recipient', '==', userName )
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()

    }).then((data)=>{
        userData.notifications =[];
        data.forEach((doc)=>{
            userData.notifications.push({
                recipient: doc.data().recipient,
                sender: doc.data().sender,
                createdAt: doc.data().createdAt,
                screamId: doc.data().screamId,
                type: doc.data().type,
                read: doc.data().read,
                notificationId: doc.id,
            });
        }); 
        return res.status(200).json(userData);
    })
    .catch((err)=>{
        console.error(err);
        return res.status(500).json({ error: err.code });
    })
}
