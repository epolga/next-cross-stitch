import { NextResponse } from 'next/server';
    import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
    import { unmarshall } from '@aws-sdk/util-dynamodb';

    const client = new DynamoDBClient({ region: 'us-east-1' });
    const tableName = 'CrossStitchItems';

    async function getItemWithMaxNGlobalPage() {
      const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'NGlobalPageIndex',
        KeyConditionExpression: 'EntityType = :et',
        ExpressionAttributeValues: { ':et': { S: 'DESIGN' } },
        ProjectionExpression: 'NGlobalPage',
        ScanIndexForward: false,
        Limit: 1
      });

      const result = await client.send(command);
      return result.Items?.length ? Number(unmarshall(result.Items[0]).NGlobalPage) : -1;
    }

    export async function GET(request: Request) {
      try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '0');
        const pageSize = parseInt(searchParams.get('pageSize') || '60');

        const total = await getItemWithMaxNGlobalPage();
        const endNGlobalPage = total - (page * pageSize);
        const startNGlobalPage = Math.max(0, endNGlobalPage - pageSize + 1);

        if (pageSize < 1 || page < 0) {
          return NextResponse.json({ error: 'Invalid page or pageSize' }, { status: 400 });
        }

        const command = new QueryCommand({
          TableName: tableName,
          IndexName: 'NGlobalPageIndex',
          KeyConditionExpression: 'EntityType = :et AND NGlobalPage BETWEEN :start AND :end',
          ExpressionAttributeValues: {
            ':et': { S: 'DESIGN' },
            ':start': { N: startNGlobalPage.toString() },
            ':end': { N: endNGlobalPage.toString() }
          },
          ScanIndexForward: false
        });

        const response = await client.send(command);
        const designs = response.Items?.map(item => {
          const data = unmarshall(item);
          return {
            designId: data.DesignID,
            albumId: parseInt(data.PK.split('#')[1]),
            caption: data.Caption,
            description: data.Description || null,
            nDownloaded: data.NDownloads || 0,
            notes: data.Notes || null,
            width: data.Width || null,
            height: data.Height || null,
            text: data.Text || null,
            nPage: data.NPage || null,
            nGlobalPage: data.NGlobalPage
          };
        }) || [];

        return NextResponse.json({
          designs,
          total,
          page,
          lastEvaluatedKey: response.LastEvaluatedKey ? JSON.stringify(response.LastEvaluatedKey) : null
        });
      } catch (err) {
        console.error('Error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
      }
    }
