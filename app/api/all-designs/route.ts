import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

// Initialize clients with explicit credentials
const credentials = fromNodeProviderChain();
const client = new DynamoDBClient({ region: 'us-east-1', credentials });
const docClient = DynamoDBDocumentClient.from(client);
const stsClient = new STSClient({ region: 'us-east-1', credentials });
const tableName = 'CrossStitchItems-prod';

export async function GET(request: Request) {
    try {
        console.log('Attempting to load credentials');
        const resolvedCredentials = await credentials();
        console.log('Credentials loaded successfully:', {
            accessKeyId: resolvedCredentials.accessKeyId ? '****' : 'undefined',
        });

        console.log('Attempting to call STS getCallerIdentity');
        const stsCommand = new GetCallerIdentityCommand({});
        const identity = await stsClient.send(stsCommand);
        console.log('Identity info:', JSON.stringify(identity));
    } catch (error) {
        console.error('STS call failed:', JSON.stringify(error, null, 2));
        // Type guard to ensure error is an Error instance
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to get caller identity', details: errorMessage },
            { status: 500 }
        );
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
        console.error('DynamoDB scan failed:', JSON.stringify(error, null, 2));
        // Type guard to ensure error is an Error instance
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'DynamoDB scan failed', details: errorMessage },
            { status: 500 }
        );
    }
}