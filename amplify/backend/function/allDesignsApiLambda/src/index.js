const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const { httpMethod, path } = event;
  try {
    if (httpMethod === 'GET' && path === '/api/all-designs') {
      const command = new ScanCommand({ TableName: 'CrossStitchItems-prod' });
      const response = await docClient.send(command);
      const items = response.Items || [];
      console.log('Scan Response:', items.length, 'items');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(items)
      };
    }
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found' })
    };
  } catch (error) {
    console.error('Operation failed:', {
      message: error.message || 'Unknown error',
      code: error.code || 'N/A',
      name: error.name || 'Unknown',
      stack: error.stack || 'N/A'
    });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to process request' })
    };
  }
};