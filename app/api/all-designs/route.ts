import { NextResponse } from 'next/server';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {DynamoDBDocumentClient, ScanCommand} from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({ region: 'us-east-1' }); // Adjust region
const docClient = DynamoDBDocumentClient.from(client);
import AWS from 'aws-sdk';
import {json} from "node:stream/consumers";
//  const client = new DynamoDBClient({ region: 'us-east-1' });
const tableName = 'CrossStitchItems-prod';
/*
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
*/
export async function GET(request: Request) {
    // Get caller identity
    const sts = new AWS.STS();
    const identity = await sts.getCallerIdentity().promise();
    console.log('Identity info: ' + JSON.stringify(identity));
  return NextResponse.json([ {
        designId: 100,
        albumId: 5,
        caption: 'Caption',
        description: 'Description',
        nDownloaded: 34,
        notes: 'note',
        width: 31,
        height: 535,
        text: 'dataText',
        nPage: 11,
        nGlobalPage: 3
    } ]);

    try {
        const command = new ScanCommand({
            TableName: tableName
        });

        const response = await docClient.send(command);
        const items = response.Items || []; // Always return array
        console.log('Scan Response:', items);
        return NextResponse.json(items);
        //return items;
    } catch (error) {
        console.error('Scan failed:', error);
        throw error;
    }


}
