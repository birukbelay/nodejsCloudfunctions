const { db } = require('../util/admin');

exports.markNotificationsRead = (req, res)=>{
    let batch = db.batch();
    req.body.foreach((notificationId)=>{
        const notification = db.doc(`/notifications/${notificationId}`);
        batch.update(notification, {read:true});
    });
    batch.commit()
    .then(()=>{
        return res.json({message:'Notifications Updated'});
    })
    .catch((err)=>{
        console.error(err);
        return res.status(500).json({error: err.code})
    })
}