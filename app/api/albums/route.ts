import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const tableName = 'CrossStitchItems';

export async function GET() {
  try {
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: 'AlbumIndex',
      KeyConditionExpression: 'EntityType = :et',
      ExpressionAttributeValues: { ':et': { S: 'ALBUM' } }
    });

    const response = await client.send(command);
    const albums = response.Items?.map(item => {
      const data = unmarshall(item);
      return {
        albumId: parseInt(data.PK.split('#')[1]),
        caption: data.Caption
      };
    }) || [];

    return NextResponse.json(albums);
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}