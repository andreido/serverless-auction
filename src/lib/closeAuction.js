import AWS from 'aws-sdk';
import { AUCTION_STATES } from '../constants';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const closeAuction = async (auctionId) => {
  const now = new Date();

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auctionId },
    UpdateExpression: 'SET #status = :status,updatedAt = :now',
    ExpressionAttributeValues: {
      ':status': AUCTION_STATES.CLOSED,
      ':now': now.toISOString()
    },
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ReturnValues: 'ALL_NEW'
  };

  const result = await dynamodb.update(params).promise();
  return result.Attributes;
};

export default closeAuction;
