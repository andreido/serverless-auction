import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';

let options = {};
if (process.env.IS_OFFLINE) {
  options = {
    region: 'localhost',
    endpoint: `http://localhost:${process.env.DDB_LOCAL_PORT}`
  };
}

const dynamodb = new AWS.DynamoDB.DocumentClient(options);

export const getAuctionById = async (id) => {
  let auction;

  try {
    const result = await dynamodb
      .get({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id }
      })
      .promise();
    auction = result.Item;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  if (!auction) {
    throw new createError.NotFound(`Auction with ID "${id}" was not found!`);
  }

  return auction;
};

const getAuction = async (event, context) => {
  const { id } = event.pathParameters;
  const auction = await getAuctionById(id);

  return {
    statusCode: 200,
    body: JSON.stringify(auction)
  };
};

export const handler = commonMiddleware(getAuction);
