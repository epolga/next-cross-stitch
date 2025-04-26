// app/lib/api.js
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

async function getCredentials() {
    try {
        const credentials = await fromNodeProviderChain()();
        console.log('Credentials loaded:', {
            accessKeyId: credentials.accessKeyId ? 'Present' : 'Missing',
            sessionToken: credentials.sessionToken ? 'Present' : 'Missing'
        });
        return credentials;
    } catch (error) {
        console.error('Failed to load credentials:', {
            message: error.message,
            code: error.code,
            name: error.name
        });
        throw error;
    }
}

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: getCredentials()
});
const docClient = DynamoDBDocumentClient.from(client);

export async function callApi() {
    console.log('Runtime Environment:', {
        region: process.env.AWS_REGION || 'us-east-1',
        nodeVersion: process.versions.node
    });
    try {
        console.log('Attempting DynamoDB Scan for CrossStitchItems-prod');
        const command = new ScanCommand({
            TableName: 'CrossStitchItems-prod',
        });
        const response = await docClient.send(command);
        const items = response.Items || [];
        console.log('Scan Response:', items.length, 'items');
        return items;
    } catch (error) {
        console.error('Scan failed:', {
            message: error.message || 'Unknown error',
            code: error.code || 'N/A',
            name: error.name || 'Unknown',
            stack: error.stack || 'N/A',
            tableName: 'CrossStitchItems',
            region: process.env.AWS_REGION || 'us-east-1'
        });
        throw new Error(`DynamoDB Scan failed: ${error.message || 'Unknown error'}`);
    }
}