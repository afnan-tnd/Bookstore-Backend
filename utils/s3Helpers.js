const AWS = require('aws-sdk');
const { MainErrorHandler } = require("./MainErrorHandler")

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_BUCKET_NAME,
} = process.env;

const s3bucket = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

/**
 * @param {Object} file
 * @param {string} file.originalname
 * @param {Buffer} file.buffer
 * @param {string} file.mimetype
 * @param {Object} uploadData
 * @param {string} uploadData.uploadDestination - required path of the file on s3
*/
exports.uploadFileHelper = async (file, uploadData = {}) => {
  try {
    const fileToUpload = file;
    /*
      uploadDestination can be a folder name so that we can upload a 
      file aFter in a folder
    */
    const { uploadDestination } = uploadData
    let uploadKey = uploadDestination

    if (!uploadKey) {
      uploadKey = Date.now() + "-" + fileToUpload.originalname;
    }
    if (fileToUpload) {
      const params = {
        Bucket: AWS_BUCKET_NAME,
        Key: uploadKey,
        Body: fileToUpload.buffer,
        ContentType: fileToUpload.mimetype,
        ACL: 'public-read',
      };
      const s3Upload = await s3bucket.upload(params).promise();

      let fileUrl = s3Upload.Location;
      let fileKey = s3Upload.key;
      const result = { fileUrl, fileKey };
      return result
    } else {
      throw new MainErrorHandler("There is no file incoming with this request", 412)
    }
  } catch (err) {
    throw new MainErrorHandler(err.message, 400)
  }
}

