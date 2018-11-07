 
//Load all the required modules 
var mailConf = require("./Mailconf");
var async = require("async");
var http = require("http");
var nodemailer = require("nodemailer");
var users = require("./fakeUsers");
///////////////

/**
 * Gets current date in the format DD-MM-YYYY, used in the subject of the mail.
 */
function getDate() {
   var date = new Date();
   var d = date.getDate();    
   var m = date.getMonth() + 1;
   var y = date.getFullYear();
   return d + "-" + m + "-" + y;
}

// Will store email sent successfully.
var success_email = [];
// Will store email whose sending is failed. 
var failure_email = [];

var transporter;

/**
 * 
 * @param {*} users The users that will be sent a mail with their notifications.
 */
function massMailer(users) {
    var self = this;
    transporter = nodemailer.createTransport({
        service : 'Gmail',
        auth: {
            user: mailConf.mailid,
            pass: mailConf.mailpass
        }
    });
    self.invokeOperation(users);
};

/* Invoking email sending operation at once */

massMailer.prototype.invokeOperation = function(users) {
    var self = this;
    async.each(users,self.SendEmail,function(){
        console.log(success_email);
        console.log(failure_email);
    });
}

/* 
* This function will be called by multiple instance, one for each mail.
*/

massMailer.prototype.SendEmail = function(user,callback) {
    console.log("Sending email to " + user.email);
    var self = this;
    self.status = false;
    // waterfall will go one after another
    // So first email will be sent
    // Callback will jump us to next function
    // in that we will update DB
    // Once done that instance is done.
    // Once every instance is done final callback will be called.
    async.waterfall([
        function(callback) {  
            //Preparation of the content of the mail sent to the user here
            var introtext = "Greetings " + user.fullName + ".<br><br>\n\nYour updates for the day are :<br>\n"
            var notifications = user.notifications.join("<br>\n")
            var outrotext = "<br>\n<br>\n<br>\nIf you dont want to recieve any more daily digest, you may change your preferences in your settings." 
            var mailOptions = {
                from: mailConf.mailid,     
                to: user.email,
                subject: 'Prello : Your daily digest of the ' + getDate(), 
                text: introtext + notifications + outrotext,
                html: "<b>"+ introtext +"</b>" + notifications + outrotext
            };
            transporter.sendMail(mailOptions, function(error, info) {               
                if(error) {
                    console.log(error)
                    failure_email.push(user.email);
                } else {
                    self.status = true;
                    success_email.push(user.email);
                }
                callback(null,self.status,user.email);
            });
        },
        function(statusCode,Email,callback) {
                console.log("Here notifications for " + Email + " will be emptied from the DB " + statusCode);
                //TODO

                callback();
        }
        ],function(){
            //When everything is done return back to caller.
            callback();
    });
}

new massMailer(users); //Needs to be commented and used from elsewhere.

