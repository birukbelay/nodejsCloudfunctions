

const isEmpty= (string)=>{
    if(string.trim() == '') return true;
    else return false;
}

const isEmail = (email)=>{
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    else return false;
}


exports.validateSignupData = (data)=>{
// console.log(data.email)
// console.log('..;..')
// console.log(data.password)
// console.log(data.confirmPassword)
    let errors ={};

    if (isEmpty(data.email)){
        
        errors.email= 'Email can not be Empty'
    }else if(!isEmail(data.email)){
        errors.email =' Must be a valid Email adress'
    }

    if (isEmpty(data.password)) errors.password= 'password can not be Empty'
    if(data.password!== data.confirmPassword) errors.confirmPassword = 'password must match'
    if (isEmpty(data.userName)) errors.userName= 'userName can not be Empty'    
   
    return{
        valid:Object.keys(errors).length ===0?true:false,
        errors        
    }

}

exports.validateLoginData =(loginData)=>{
    let errors = {}
    console.log("validating ...")

    if (isEmpty(loginData.email)) {

        errors.email = 'email can not be empty'
    } else if (!isEmail(loginData.email)) {
        errors.email = 'email must be valid'
    }

    if (isEmpty(loginData.password)) errors.password = 'password can not be empty'
    if (isEmail(loginData.email)) errors.email = ''

    return{
        valid:Object.keys(errors).length ===0?true:false,
        errors        
    }

}

exports.reduceUserDetails = (data)=>{
    let userDetails ={}
    if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if(!isEmpty(data.location.trim())) userDetails.location = data.location;
    if(!isEmpty(data.website.trim())) {
        // https://abc.com
        if(data.website.trim().substring(0,4) !=='http'){
            userDetails.website= `http://${data.website.trim()}`;
        }else userDetails.website = data.website;
    }
    return userDetails;
};