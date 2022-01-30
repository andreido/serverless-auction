import AWS from 'aws-sdk';
import createError from 'http-errors';
import validator from '@middy/validator';

import commonMiddleware from '../lib/commonMiddleware';
import { getAuctionsSchema } from './schemas';

let options = {};
if (process.env.IS_OFFLINE) {
  options = {
    region: 'localhost',
    endpoint: `http://localhost:${process.env.DDB_LOCAL_PORT}`
  };
}

const dynamodb = new AWS.DynamoDB.DocumentClient(options);

const getAuctions = async (event, context) => {
  const { status } = event.queryStringParameters;
  let auctions = [];

  const params =
    status === '*'
      ? {
          TableName: process.env.AUCTIONS_TABLE_NAME
        }
      : {
          TableName: process.env.AUCTIONS_TABLE_NAME,
          IndexName: process.env.STATUS_AND_EXPIRES_AT_GSI_NAME,
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeValues: { ':status': status.toUpperCase() },
          ExpressionAttributeNames: { '#status': 'status' }
        };

  try {
    let result =
      status === '*'
        ? await dynamodb.scan(params).promise()
        : await dynamodb.query(params).promise();
    auctions = result.Items;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions)
  };
};

export const handler = commonMiddleware(getAuctions).use(
  validator({
    inputSchema: getAuctionsSchema,
    ajvOptions: {
      useDefaults: true,
      strict: false
    }
  })
);
