import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import validator from '@middy/validator';

import { createAuctionSchema } from './schemas';
import { AUCTION_STATES, EXPIRY_DURATION } from '../constants';

let options = {};
if (process.env.IS_OFFLINE) {
  options = {
    region: 'localhost',
    endpoint: `http://localhost:${process.env.DDB_LOCAL_PORT}`
  };
}

const dynamodb = new AWS.DynamoDB.DocumentClient(options);

const createAuction = async (event, context) => {
  const { title } = event.body;
  const { name, nickname, email } = event.requestContext.authorizer;
  const now = new Date();
  const expiry = new Date();
  expiry.setMinutes(now.getMinutes() + EXPIRY_DURATION);

  const auction = {
    title,
    id: uuidv4(),
    status: AUCTION_STATES.OPEN,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
    highestBid: {
      amount: 0
    },
    seller: { name, nickname, email }
  };

  try {
    await dynamodb
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Item: auction
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201, // 201 = Resource Created
    body: JSON.stringify(auction)
  };
};

export const handler = commonMiddleware(createAuction).use(
  validator({
    inputSchema: createAuctionSchema,
    ajvOptions: {
      strict: false
    }
  })
);
