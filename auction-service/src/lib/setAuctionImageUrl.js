import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const setAuctionImageUrl = async (id, imageUrl) => {
  const now = new Date();

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: 'SET imageUrl = :imageUrl, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':updatedAt': now.toISOString(),
      ':imageUrl': imageUrl
    },
    ReturnValues: 'ALL_NEW'
  };

  const result = await dynamodb.update(params).promise();

  return result.Attributes;
};

export default setAuctionImageUrl;
