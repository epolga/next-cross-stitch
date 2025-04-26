import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const stsClient = new STSClient({ region: 'us-east-1' });
const tableName = 'CrossStitchItems-prod';

export async function GET(request: Request) {
    try {
        console.log('Attempting to call STS getCallerIdentity');
        const stsCommand = new GetCallerIdentityCommand({});
        const identity = await stsClient.send(stsCommand);
        console.log('Identity info:', JSON.stringify(identity));
    } catch (error) {
        console.error('STS call failed:', error);
        return NextResponse.json({ error: 'Failed to get caller identity' }, { status: 500 });
    }

    try {
        console.log('Attempting DynamoDB scan');
        const command = new ScanCommand({
            TableName: tableName,
        });

        const response = await docClient.send(command);
        const items = response.Items || [];
        console.log('Scan Response:', items);
        return NextResponse.json(items);
    } catch (error) {
        console.error('DynamoDB scan failed:', error);
        return NextResponse.json({ error: 'DynamoDB scan failed' }, { status: 500 });
    }
}