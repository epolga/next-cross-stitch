// Custom logger for credential provider chain
const credentialLogger = {
    info: (message) => console.log(`[CREDENTIALS] INFO: ${message}`),
    warn: (message) => console.warn(`[CREDENTIALS] WARN: ${message}`),
    error: (message) => console.error(`[CREDENTIALS] ERROR: ${message}`),
    debug: (message) => console.debug(`[CREDENTIALS] DEBUG: ${message}`),
};

// AWS SDK v3 imports
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const {fromNodeProviderChain} = require("@aws-sdk/credential-providers");
// Initialize STS client
const stsClient = new STSClient({ region: 'us-east-1' }); // Uses Lambda execution role by default
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


async function callApi() {
    console.log('Runtime Environment:', {
        region: process.env.AWS_REGION || 'us-east-1',
        nodeVersion: process.versions.node
    });
    try {
        console.log('Attempting DynamoDB Scan for CrossStitchItems');
        const command = new ScanCommand({
            TableName: 'CrossStitchItems',
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

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    console.log('Attempting to load credentials');

    try {
        // Optional: Explicitly resolve credentials for debugging
        const credentials = await defaultProvider({
            logger: credentialLogger,
            clientConfig: { region: 'us-east-1' },
        })();
        console.log('Credentials loaded successfully!', {
            accessKeyId: credentials.accessKeyId ? '****' : 'undefined',
        });

        // Verify credentials with STS
        console.log('Attempting to call STS getCallerIdentity');
        const stsCommand = new GetCallerIdentityCommand({});
        const identity = await stsClient.send(stsCommand);
        console.log('Identity info:', JSON.stringify(identity));
        const items = await callApi();
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Enable CORS
                'Access-Control-Allow-Headers': '*',
            },
            body: JSON.stringify({
                message: 'Successfully fetched credentials',
                identity: {
                    UserId: identity.UserId,
                    Account: identity.Account,
                    Arn: identity.Arn,
                },
            }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
            },
            body: JSON.stringify({ error: error.message }),
        };
    }
};

