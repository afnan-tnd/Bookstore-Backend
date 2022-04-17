var nodemailer = require("nodemailer");
var ejs = require("ejs");
const path = require("path");
/**
 * @param{String} - User email its optional
 * @param{String} - Mail Password its optional
 * @param{String} - location of template
 * @param {Sting} - receiver's email
 * @param {Object} - Dynamic data to render
 * @param {String} - Mail Subject
*/
const { MAIL_EMAIL, MAIL_PASSWORD } = process.env;
async function templatedMailSender(
  destinationMail,
  templateLoc,
  dynamicData,
  passedSubject
) {
  const MailUser = MAIL_EMAIL;
  const MailPass = MAIL_PASSWORD;
  if (passedSubject == undefined || passedSubject == null) {
    passedSubject = "No subject"
  }
  console.log("mail sender ==================>");
  console.log(MailUser, MailPass, destinationMail, templateLoc, dynamicData);
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MailUser,
        pass: MailPass,
      },
    });
    ejs.renderFile(
      path.join(__dirname, templateLoc),
      dynamicData,
      function (err, data) {
        if (err) {
          reject(err);
        } else {
          let mailOptions = {
            from: MailUser,
            to: destinationMail,
            subject: passedSubject,
            html: data,
          };
          transporter.sendMail(mailOptions, function (err_mail, mailData) {
            if (err_mail) {
              console.log("error occurec in nodemailer");
              reject(err_mail);
            } else {
              console.log("good mail sent");
              resolve({ mailData, msg: "email link sent" });
            }
          });
        }
      },
    );
  });
}
module.exports = { templatedMailSender };
