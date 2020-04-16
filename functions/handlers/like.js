const { db } = require('../util/admin');



// |=======| 1 |======================================|
// |====== ----- like a scream  ----- ================|
// |====== -----> likeScream  ----- ==================|
// |--------------------------------------------------|

exports.likeScream = (req, res) => {

    let screamId = req.params.screamid;
    let userName = req.user.userName;

    const screamDocument = db.doc(`/screams/${screamId}`);

    // TODO change the like and comment of the scream to its own sub collection    
    const likeDocument =
        db.collection('likes')
            .where('screamId', '==', `${screamId}`)
            .where('userName', '==', userName)
            .limit(1);

    let screamData;
    screamDocument.get()
        .then((doc) => {
            if (!doc.exists) return res.status(404).json({ error: 'scream not found' });              
                     
            screamData=doc.data();
            screamData.screamId= doc.id;

           return likeDocument.get();
                
        }).then((data) => {
            // Here we want the data to be empty so we use !
            if (!data.empty) return res.status(400).json({ error: 'scream already liked' });              
            
            return db.collection('likes').add({
                screamId: screamId,
                userName: userName,
                createdAt: new Date().toISOString(),

            })
            .then(()=>{
                screamData.likeCount++
                return screamDocument.update({likeCount:screamData.likeCount});
            })
            .then(()=>{
                return res.status(201).json(screamData);
            })
        })
        .catch(err=>{
            console.error(err);
            return res.status(500).json({ error: err.code })

        });

}

// |================================================================|
// |===============--------- UNlike scream  ------------------======|
// |================================================================|

exports.unlikeScream=(req, res)=>{

    const screamId =req.params.scramId;
    const userName= req.body.userName;

    const screamQuery= db.doc(`/screams/${screamid}`);

    const likeQuery = db.collection('likes').where('userName', '==', userName)
    .where('screamId', '==', screamId)
    .limit(1);

    let screamData;
    screamQuery.get()
    .then((doc)=>{
        if(!doc.exists) return res.status(404).json({error:'the scream doesnt exists'});            
        
        screamData=doc.data();
        screamData.screamId= doc.id;

        likeQuery.get()
        .then((data)=>{
            // we want the data to be empty in here
            if(data.empty) return res.status(404).json({error: 'scream already unliked'});
            //               data.docs[0].data().userName  -- gives the other elements of the above data
            db.doc(`/likes/${data.docs[0].id}`).delete()
                      
        })
        .then(()=>{
            screamData.likeCount--;
            return db.doc(`/screams/${screamId}`).update({likeCount:screamData.likeCount});            
        })
        .then(()=>{
            res.status(201).json(screamData);
        })
    })
    .catch((err)=>{
        console.error(err);
        return res.status(500).json({error:err.code});
    });
    
}