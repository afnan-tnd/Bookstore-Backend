const AWS = require('aws-sdk');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');

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

exports.uploadimage = catchAsync(async (req, res, next) => {
  const image = req.file;
  if (image) {
    const params = {
      Bucket: AWS_BUCKET_NAME,
      Key: image.originalname,
      Body: image.buffer,
      ContentType: image.mimetype,
      ACL: 'public-read',
    };
    const s3Upload = await s3bucket.upload(params).promise();

    let imageUrl = s3Upload.Location;
    let imageKey = s3Upload.key;
    const result = { imageUrl, imageKey };

    if (!result) {
      return next(
        new AppError('something went wrong while uploading image', 400)
      );
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } else {
    return next(new AppError('no image foun', 400));
  }
});

exports.profilepic = async (image) => {
  if (image) {
    const params = {
      Bucket: AWS_BUCKET_NAME,
      Key: image.originalname,
      Body: image.buffer,
      ContentType: image.mimetype,
      ACL: 'public-read',
    };
    const s3Upload = await s3bucket.upload(params).promise();

    let imageUrl = s3Upload.Location;
    let imageKey = s3Upload.key;
    const result = { imageUrl, imageKey };
    return result;
  } else {
    return next(new AppError('no image foun', 400));
  }
};
