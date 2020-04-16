const { db } = require('../util/admin');

// |=======| 1 |============================================|
// |====== ----- get All screams  ----------------==========|
// |====== -----> getAllScreams   ----------------==========|
// |========================================================|

exports.getAllScreams = (req, res) => {
    db
        .collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let screams = [];
            data.forEach((doc) => {
                screams.push({
                    screamId: doc.id,
                    body: doc.data().body,
                    userName: doc.data().userName,
                    createdAt: doc.data().createdAt,
                    likeCount: doc.data().likeCount,
                    commentCount: doc.data().commentCount,
                    userImage: doc.data().userImage,
                });
            });
            return res.json(screams);
        })
        .catch((err) => console.error(err));
}

// |=======| 2 |============================================|
// |====== ----- fetch one scream  ----- ===================|
// |====== -----> getScream  ----- =========================|
// |========================================================|
exports.getScream = (req, res) => {
    let screamData = {};
    const id = req.params.screamId;

    db
        .doc(`/screams/${id}`)
        .get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'scream detail not found' })
            }
            screamData = doc.data();
            screamData.screamId = doc.id;
            // getting the comments of the function
            // TODO limit the comments
            return db
                .collection('/comments')
                .where('screamId', '==', `${id}`)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
        })
        .then((data) => {
            screamData.comments = [];
            data.forEach((doc) => {
                screamData.comments.push(doc.data())
            });
            return res.status(200).json(screamData);

        })
        .catch((err) => {
            console.error(err)
            return res.status(500).json({ error: err.code });
        })

}
// |=======| 3 |============================================|
// |====== ----- post a scream  ----- ======================|
// |====== -----> postOneScream  ----- =====================|
// |--------------------------------------------------------|

exports.postOneScream = (req, res) => {

    if (req.body.body.trim() === '') return res.status(400).json({ error: 'BOdy must not be empty' })
    const newScream = {
        body: req.body.body,
        userName: req.user.userName,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
    };

    db
        .collection('screams')
        .add(newScream)
        .then((doc) => {
            const resScream = newScream;
            resScream.screamId = doc.id

            return res.status(201).json({ resScream });
        })
        .catch((err) => {
            console.error(err);
            return res.status(400).json({ error: 'some thing went wrong' });

        });


};
// |=======|  4 |============================================|
// |====== ----- update a scream  ----- =====================|
// |====== -----> updateScream  ----- =======================|
// |---------------------------------------------------------|



exports.updateScream= (req, res)=>{
    let userName =req.user.userName;
    if(req.body.body.trim()==='')  return res.status(400).json({Scream:'scream body connot be empty'});
    
    newScream = {        
        userName: userName,
        body: req.body.body,
        createdAt: new Date().toISOString,
        userImage: req.user.imageUrl,
        commentCount:req.body.commentCount,
        likeCount:req.body.likeCount,
        screamId:req.body.screamId
    };


    db.docs(`/scream/${newScream.screamId}`).get()
    .then((doc)=>{
        if (!doc.exists) {
            return res.status(404).json({error:'SCREAM_NOT_FOUND'});
        }else if(doc.data().userName!=newScream.userName){
            return res.status(404).json({error:'UNAUTHORISED'});
        }else{
            return doc.ref.update({
                body:newScream.body,
                createdAt:newScream.createdAt,
                userImage:newScream.userImage,
                updatedAt: new Date().toISOString,                
            });
     
        }
    }).then(() => {
        res.status(201).json({ message: 'success', body: newScream })
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({ error: 'some thing went wrong' })
    })
}
// |=======|  5 |============================================|
// |====== ----- delete a scream  ----- =====================|
// |====== -----> deleteScream  ----- =======================|
// |---------------------------------------------------------|

exports.deleteScream=(req, res)=>{

    let screamId = req.params.id;
    let userName =req.user.userName;

    db.docs(`/scream/${screamId}`).get()
    .then((doc)=>{
        if (!doc.exists) {
            return res.status(404).json({error:'SCREAM_NOT_FOUND'});
        }else if(doc.data().userName!=userName){
            return res.status(404).json({error:'UNAUTHORISED'});
        }else{
            return document.delete();
        }
    })
    .then(()=>{
        res.status(201).json({message:'SUCSSES'})
    })
    .catch((err)=>{
        console.error(err);
        res.status(500).json({error:err.code});
    })
}











// exports.getComments = (req, res) => {

//     const id = req.params.screamId;
//     db
//         .collection('/comments')
//         .where('screamId', '==', `${id}`)
//         .orderBy('createdAt', 'desc')
//         .get()
//         .then((data) => {

//             data.forEach((doc) => {
//                 comments.push({
//                     userName: doc.userName,
//                     screamId: doc.screamId,
//                     body: doc.body,
//                     createdAt: doc.createdAt,
//                 })
//             })
//             return res.status(200).json(comments);
//         })
//         .catch((err) => {
//             console.error(err)
//             return res.status(500).json(err);
//         })
// }