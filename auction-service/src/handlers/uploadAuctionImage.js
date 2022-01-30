import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import createError from 'http-errors';
import validator from '@middy/validator';
import httpCors from '@middy/http-cors';

import { uploadAuctionImageSchema } from './schemas';
import { getAuctionById } from './getAuction';
import uploadImageToS3 from '../lib/uploadImageToS3';
import setAuctionImageUrl from '../lib/setAuctionImageUrl';

const uploadAuctionImage = async (event, context) => {
  const {
    body: imageData,
    pathParameters: { id },
    requestContext: {
      authorizer: { email }
    }
  } = event;
  const auction = await getAuctionById(id);

  if (email !== auction.seller.email) {
    throw new createError.Forbidden(
      'You can only upload auction images to your own auctions!'
    );
  }

  const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  let updatedAuction;

  try {
    const imageUrl = await uploadImageToS3(`${auction.id}.jpg`, buffer);
    updatedAuction = await setAuctionImageUrl(id, imageUrl);
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction)
  };
};

export const handler = middy(uploadAuctionImage)
  .use(httpErrorHandler())
  .use(httpCors())
  .use(
    validator({
      inputSchema: uploadAuctionImageSchema,
      ajvOptions: {
        strict: false
      }
    })
  );
