const { admin, db } = require('../util/admin');

const config = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(config);




const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators');

// ========================================================================|
// ============------------- signupFunction ---------------================|
exports.signup = (req, res) => {

    const newUser = {
        userName: req.body.userName,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,

    };

    // console.log(`valid..${newUser.userName} ${newUser.email} ${newUser.password} ${newUser.confirmPassword}`)


    //  this is validating the user input
    const { valid, errors } = validateSignupData(newUser);

    if (!valid) return res.status(400).json({error:errors});

    // TODO create a no user image in the database 
    const noImg = 'no-user-img.png';

    let token, userIDs;
    // checks if the user userName exists then create user in the authentication db
    db.doc(`/users/${newUser.userName}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ userName: 'USERNAME_EXISTS' });
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newuser.email, newUser.password);
            }
        })
        .then((data => {
            userIDs = data.user.uid;
            return data.user.getIdToken();

        }))
        // create user in the user database 
        .then((idToken) => {
            token = idToken;
            const userCredentials = {
                userName: newUser.userName,
                email: newUser.email,
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
                createdAt: new Date().toISOString(),
                userId: userIDs

            };
            return db.doc(`/users/${newUser.userName}`).set(userCredentials);

        }).then(() => {
            return res.status(201).json({ token });

        })
        .catch((err) => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: 'EMAIL_EXISTS' });
            }
            return res.status(500).json({ error: 'some thing happned please try again' });

        });
}

// ========================================================================
// =========-----------------  login function --------==================

exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    //  ==========-----validating fields ------------=========    
    const { valid, errors } = validateLoginData(user);

    if (!valid) return res.status(400).json(errors);


    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({ token })
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/wrong-password') {
                return res.status(403).json({ general: 'Wrong credentials, please try again' });
            } else
                res.status(500).json({ error: err.code });
        })

}



// ====================================================================|
// ============== ----------------- uploadImage-----------=============|

exports.uploadImage = (req, res) => {

    // FIXME SUSPECTED_ERROR  bus boy spelling
    const busboy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if(mimetype!=='image/jpeg'&& mimetype !== 'image/png'){
            return res.status(400).json({error:'Wrong file type subitted'})
        }
        // my.img.jpg  to get the last extension
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        // TODO create unique id using uuid
        const imageFileName = `${Math.round.random() * 10000}.${imageExtension}`;
        const filepath = path.join(os.tempdir(), imageFileNmae);
        // object
        imageToBeUpload = { filepath, mimetype };
        // fileSystem library to create the file
        file.pipe(fs.createWriteStream(filepath));
    });

    busboy, on('finish', () => {
        admin.storage().bucket.upload(imageToBeUpload, {
            metadata: {
                metadata: {
                    contentType: imageToBeUpload.mimetype
                }
            }
        })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${req.user.userName}`).update({ imageUrl: imageUrl });
            })
            .then(() => {
                return res.json({ message: 'Image upload succesfully' })
            })
            .catch(err => {
                console.error(err);
                return res.status(500).json({ error: err.code });
            })
    });
    busboy.end(req.rawBody);
}