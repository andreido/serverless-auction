import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import validator from '@middy/validator';

import { getAuctionById } from './getAuction';
import { placeBidSchema } from './schemas';
import { AUCTION_STATES } from '../constants';

let options = {};
if (process.env.IS_OFFLINE) {
  options = {
    region: 'localhost',
    endpoint: `http://localhost:${process.env.DDB_LOCAL_PORT}`
  };
}

const dynamodb = new AWS.DynamoDB.DocumentClient(options);

const placeBid = async (event, context) => {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { name, nickname, email } = event.requestContext.authorizer;
  const bidder = { name, nickname, email };

  const auction = await getAuctionById(id);
  const now = new Date();
  let updatedAuction;

  // Prevent bidding on CLOSED auctions
  if (auction.status === AUCTION_STATES.CLOSED) {
    throw new createError.Forbidden(`You cannot bid on closed auctions!`);
  }

  // Prevent bidding amounts less than or equal to highest bid amount
  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(
      `Your bid must be higher than $${auction.highestBid.amount}!`
    );
  }

  // Prevent seller from bidding on their own auction
  if (bidder.email === auction.seller.email) {
    throw new createError.Forbidden(`You cannot bid on your own auctions!`);
  }

  // Prevent multiple consecutive bids by the same user (double bidding)
  if (bidder.email === auction.highestBid.bidder?.email) {
    throw new createError.Forbidden(
      `You are already the highest bidder for this auction!`
    );
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: `SET 
      highestBid.amount = :amount, 
      highestBid.bidder = :bidder, 
      updatedAt = :updatedAt
      `,
    ExpressionAttributeValues: {
      ':amount': amount,
      ':bidder': bidder,
      ':updatedAt': now.toISOString()
    },
    ReturnValues: 'ALL_NEW' // return all modified objects
  };

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction)
  };
};

export const handler = commonMiddleware(placeBid).use(
  validator({
    inputSchema: placeBidSchema,
    ajvOptions: {
      useDefaults: true,
      strict: false
    }
  })
);
