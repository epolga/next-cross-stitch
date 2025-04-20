import { NextResponse } from 'next/server';
    import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
    import { unmarshall } from '@aws-sdk/util-dynamodb';

    const client = new DynamoDBClient({ region: 'us-east-1' });
    const tableName = 'CrossStitchItems';

    export async function GET(request: Request, { params }: { params: { designId: string } }) {
      try {
        const designId = parseInt(params.designId);
        if (isNaN(designId) || designId <= 0) {
          return NextResponse.json({ error: 'Invalid designId' }, { status: 400 });
        }

        const command = new QueryCommand({
          TableName: tableName,
          IndexName: 'DesignIndex',
          KeyConditionExpression: 'EntityType = :et AND DesignID = :did',
          ExpressionAttributeValues: {
            ':et': { S: 'DESIGN' },
            ':did': { N: designId.toString() }
          }
        });

        const response = await client.send(command);
        if (!response.Items || response.Items.length === 0) {
          return NextResponse.json({ error: 'Design not found' }, { status: 404 });
        }

        const data = unmarshall(response.Items[0]);
        const design = {
          designId: parseInt(data.DesignID),
          albumId: parseInt(data.AlbumID),
          caption: data.Caption || '',
          description: data.Description || '',
          nDownloaded: parseInt(data.NDownloaded) || 0,
          notes: data.Notes || '',
          width: parseInt(data.Width) || 0,
          height: parseInt(data.Height) || 0,
          text: data.Text || '',
          nPage: parseInt(data.NPage) || 0
        };

        return NextResponse.json(design);
      } catch (err) {
        console.error('Error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
      }
    }