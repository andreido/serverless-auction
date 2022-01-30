import AWS from 'aws-sdk';
import { AUCTION_STATES } from '../constants';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const getExpiredAuctions = async () => {
  const now = new Date();

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: process.env.STATUS_AND_EXPIRES_AT_GSI_NAME,
    // KeyConditionExpression: a condition that specifies the key values for items to be retrieved by the Query action
    // - the condition must perform an equality test on a single partition key value
    // - the condition can optionally perform one of several comparison tests on a single sort key value
    // - Syntax: 'partitionKeyName = :partitionkeyval AND sortKeyName = :sortkeyval'
    KeyConditionExpression: '#status = :status AND expiresAt <= :expiresAt', // we only want to retrieve the expired open auctions
    // Remember to use the ExpressionAttributeValues parameter to replace tokens
    // such as :partitionval and :sortval with actual values at runtime
    ExpressionAttributeValues: {
      ':status': AUCTION_STATES.OPEN,
      ':expiresAt': now.toISOString()
    },
    // You can optionally use the ExpressionAttributeNames parameter to replace the names of the
    // partition key (partitionKeyName) and sort key (sortKeyName) with placeholder tokens
    // - This option might be necessary if an attribute name conflicts with a DynamoDB reserved word (e.g. 'status')
    ExpressionAttributeNames: {
      '#status': 'status'
    }
  };

  const result = await dynamodb.query(params).promise();
  return result.Items;
};

export default getExpiredAuctions;
