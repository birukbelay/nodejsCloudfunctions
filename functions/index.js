const functions = require('firebase-functions');
const app = require('express')();
// const app = express();

const{db}= require('./util/admin')

// Signing
const {
    signup, 
    login, 
    uploadImage, 
} =require('./handlers/signing')
// Users
const {   
    addUserDetail, 
    getAuthenticatedUser,
    getUserDetails,   
} = require('./handlers/users');
// Screams
const { 
    getAllScreams,
    getScream,
    postOneScream,
    deleteScream,    
} = require('./handlers/screams');

const{ commentOnScream} = require('./handlers/comment');
const{ likeScream, unlikeScream} = require('./handlers/like');
const {markNotificationsRead,} = require('./handlers/notification');

//Auth 
const FBAuth = require('./util/fbAuth');

// MOCKS
const mockFbAuth =require('./util/mock/mockFbAuth');

// |==========| 1 |==============================|
// |========= ----- user Routes  ----- ==========|
// |---------------------------------------------|
app.get('/user', FBAuth, getAuthenticatedUser);
app.post('/user', FBAuth, addUserDetail);
app.get('/user/:userName', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

// |==========| 2 |==============================|
// |========= ----- sign  routes  ----- =========|
// |---------------------------------------------|
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);

// |==========| 4 |==============================|
// |========= ----- Scream routes ----- =========|
// |---------------------------------------------|
app.get('/screams', getAllScreams);
app.get('/scream/:screamId',  getScream);
app.post('/scream',mockFbAuth, postOneScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);
app.put('/scream/:screamId', FBAuth, updateScream);

// |==========| 5 |===============================|
// |========= ----- Comment routes ----- =========|
// |----------------------------------------------|
// TODO app.get('/scream/:screamId/comments', getCommentOnScream);
app.post('/scream/:screamId/comment',FBAuth, commentOnScream);
//TODO app.put('/scream/:screamId/comment/:commentId',FBAuth, updateCommentOnScream);
//TODO app.delete('/scream/:screamId/comment/:commentId',FBAuth, deleteCommentOnScream);

// |==========| 6 |===============================|
// |========= ----- Likes routes ----- ===========|
// |----------------------------------------------|
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);





exports.api = functions.region('europe-west3').https.onRequest(app);

// ======================================================================|
// TODO change db to allow read, write :if false; on vid-13 min-24:54
// TODO features to add
// , report   1)Comment, 2) review, 3)
// comment on comment
// shop blog  

// ======================================================================|
//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||

// |================================================================================|
// |=================  -----------  triggered Functions ----------  ================|
// |================================================================================|

//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||
//                 ||                                       ||

//  --------  Like Notification-------------
exports.createNotificationOnLike = functions.region('europe-west3').firestore.document(`likes/{id}`)
.onCreate((snapshot)=>{

    return db.doc(`/screams/${snapshot.data().screamId}`).get()
    .then(doc =>{
        if(doc.exists && doc.data().userName !=snapshot.data().userName){
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender:snapshot.data().userHandle,
                type: 'like',
                read:false,
                screamId:doc.id
            });
        }
    })
    // .then(()=>{
    //     return;
    // })
    .catch((err)=>{
        console.error(err);
        return;
    })
});

// -------------- Delete Like Notification ----------------
exports.deleteNotificationsOnUnLike= functions
.region("europe-west3")
.firestore.document(`like/{id}`)
.onDelete((snapshot)=>{
    return db.doc(`/notifications/${snapshot.id}`).delete()
   
    .catch((err)=>{
        console.error(err);
        return;
    });

});

//  -------------- Comment Notification --------------------
exports.createNotificationOnComment = functions
.region('europe-west3')
.firestore.document(`comments/{id}`)
.onCreate((snapshot) =>{

    return db.doc(`/screams/${snapshot.data().screamId}`).get()
    .then(doc =>{
        if(doc.exists && doc.data().userName !=snapshot.data().userName){
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender:snapshot.data().userHandle,
                type: 'comment',
                read:false,
                screamId:doc.id
            });
        }
    })
    
    .catch((err)=>{
        console.error(err);
        return;
    });
})

exports.onUserImageChange = functions.region('europe-west3')
.firestore.document('/users/{userId}')
.onUpdate((change)=>{
    console.log(change.before.data());
    console.log(change.after.data());

   if(change.before.data().imageUrl!=change.after.data().imageUrl){
    let batch = db.batch();
    return db.collection('screams').where('userName', '==', chandge.before.data().userName).get()

    .then((data)=>{
        data.forEach(doc=>{
            const scream = db.doc(`/screams/${doc.id}`);
        batch.update(scream, {userImage:change.after.data().imageUrl})
        })
        return batch.commit();
        
    })
    .catch((err)=>{
        console.error(err);
        return;
    });

   } else return true;

});


exports.onScreamDelete = functions
    .region('europe-west3')
    .firestore.document('/screams/{screamId}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();

        return db.collection('comments').where('screamId', '==', screamId).get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                })
                return db.collection('likes').where('screamId', '==', screamId).get()
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                })
                return db.collection('notifications').where('screamId', '==', screamId).get()

            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/notifications/${doc.id}`));
                })
                return batch.commit();
            })
            .catch((err)=>{
                console.error(err);
              
            });
    })
