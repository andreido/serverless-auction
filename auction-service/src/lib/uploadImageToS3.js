import AWS from 'aws-sdk';

const s3 = new AWS.S3();

/**
 * Uploads an image to an S3 bucket with a specified Object Key
 *
 * @param {string} key S3 Object Key
 * @param {object} body image data buffer
 */
const uploadImageToS3 = async (key, body) => {
  const result = await s3
    .upload({
      Bucket: process.env.AUCTIONS_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg'
    })
    .promise();

  return result.Location;
};

export default uploadImageToS3;
