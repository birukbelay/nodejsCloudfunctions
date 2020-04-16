const { db } = require('../util/admin');


// |=======| 3 |============================================|
// |====== ----- comment on a scream  ----- ================|
// |====== -----> commentOnScream  ----- ===================|
// |--------------------------------------------------------|
exports.commentOnScream = (req, res) => {
    // the req.user object is get from the FBAuth middleware
    let userName = req.user.userName;
    let screamId = req.params.screamId;
   
    if (req.body.body.trim() === '') return res.status(400).json({ comment: 'must not be empty' })
    newComment = {
        
        userName: userName,
        screamId: screamId,
        body: req.body.body,
        createdAt: new Date().toISOString,
        userImage: req.user.imageUrl
    };

    db.doc(`/screams/${screamId}`).get()
        .then(doc => {
            if (!doc.exists) return res.status(404).json({ error: 'scream not found' })
            
            return db.collection('comments').add(newComment);

        }).then(()=>{
            // FIXME this may cause errors
            return doc.ref.update({commentCount:doc.data().commentCount++});
        }).then(() => {
            res.status(201).json({ message: 'success', body: newComment })
        }).catch(err => {
            console.error(err);
            return res.status(500).json({ error: 'some thing went wrong' })
        })
}